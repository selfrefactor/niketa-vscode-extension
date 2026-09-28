//! Port of the VS Code "Run Niketa scripts" extension
//! (`niketa.request.run.script` / `niketa.request.lint.file`) to Zed.
//!
//! Zed extensions expose no command-palette/keybind surface (v0.7.0 API),
//! so these are exposed as slash commands in the Assistant:
//!
//! - `/niketa run <path>`  - run the niketaScripts command matching <path>
//! - `/niketa lint <path>` - run `run fmt <path>`
//! - `/niketa status`      - describe the active niketaScripts config
//!
//! The `<path>` argument is relative to the worktree root.
//! Scripts are executed with `sh -lc "cd <root> && <command> <path>"`.

use zed_extension_api as zed;
use zed::serde_json::Value;

struct NiketaExtension;

/// `yarn lint:file(s)` commands run on the actual file, not the spec file.
const LINT_COMMANDS: &[&str] = &["yarn lint:files", "yarn lint:file"];

impl zed::Extension for NiketaExtension {
    fn new() -> Self {
        Self
    }

    fn complete_slash_command_argument(
        &self,
        _command: zed::SlashCommand,
        _args: Vec<String>,
    ) -> zed::Result<Vec<zed::SlashCommandArgumentCompletion>> {
        Ok(Vec::new())
    }

    fn run_slash_command(
        &self,
        command: zed::SlashCommand,
        args: Vec<String>,
        worktree: Option<&zed::Worktree>,
    ) -> zed::Result<zed::SlashCommandOutput> {
        let worktree = worktree
            .ok_or("niketa: slash commands need an open worktree (project)")?;

        let text = match command.name.as_str() {
            "run" => run(worktree, &args),
            "lint" => lint(worktree, &args),
            "status" => status(worktree),
            other => Err(format!("niketa: unknown slash command `{other}`")),
        }?;

        Ok(zed::SlashCommandOutput {
            text,
            sections: Vec::new(),
        })
    }
}

zed::register_extension!(NiketaExtension);

// ---------------------------------------------------------------------------
// config
// ---------------------------------------------------------------------------

#[derive(Default)]
struct NiketaConfig {
    /// Glob -> command pairs of the active script set (old or new format).
    scripts: Vec<(String, String)>,
    /// Names of the script sets (new `scripts + active` format).
    named: Vec<String>,
    /// Currently active script set name (new format).
    active: Option<String>,
    /// `niketaScriptsLegacy`: exact relative path -> command.
    legacy: Vec<(String, String)>,
}

fn load_config(worktree: &zed::Worktree, root: &str) -> NiketaConfig {
    let raw = read_project_file(worktree, root, "package.json").ok();
    let Some(raw) = raw else {
        return NiketaConfig::default();
    };
    let Ok(value) = zed::serde_json::from_str::<Value>(&raw) else {
        return NiketaConfig::default();
    };
    parse_config(&value)
}

fn parse_config(package: &Value) -> NiketaConfig {
    let mut config = NiketaConfig::default();

    if let Some(niketa) = package.get("niketaScripts").and_then(Value::as_object) {
        let is_named =
            niketa.get("scripts").and_then(Value::as_object).is_some() && niketa.get("active").is_some();

        if is_named {
            if let (Some(sets), Some(active)) = (
                niketa.get("scripts").and_then(Value::as_object),
                niketa.get("active").and_then(Value::as_str),
            ) {
                config.named = sets.keys().cloned().collect();
                config.active = Some(active.to_string());
                if let Some(set) = sets.get(active).and_then(Value::as_object) {
                    config.scripts = collect_string_map(set);
                }
            }
        } else {
            config.scripts = collect_string_map(niketa);
        }
    }

    if let Some(legacy) = package
        .get("niketaScriptsLegacy")
        .and_then(Value::as_object)
    {
        config.legacy = collect_string_map(legacy);
    }

    config
}

fn collect_string_map(obj: &zed::serde_json::Map<String, Value>) -> Vec<(String, String)> {
    obj.iter()
        .filter_map(|(key, value)| value.as_str().map(|s| (key.clone(), s.to_string())))
        .collect()
}

// ---------------------------------------------------------------------------
// commands
// ---------------------------------------------------------------------------

fn run(worktree: &zed::Worktree, args: &[String]) -> zed::Result<String> {
    let root = worktree.root_path();
    let rel = file_arg(args)?;
    let config = load_config(worktree, &root);

    if !config.legacy.is_empty() {
        for (path, command) in &config.legacy {
            if path == &rel {
                return exec_shell(worktree, &root, command, None);
            }
        }
        return Ok(format!("niketa: no legacy entry for `{rel}`"));
    }

    if config.scripts.is_empty() {
        // Fallback, same as the VS Code extension: lint when nothing is configured.
        return do_lint(worktree, &root, &rel);
    }

    // Single catch-all rule.
    if config.scripts.len() == 1 && config.scripts[0].0 == "*" {
        return exec_shell(worktree, &root, &config.scripts[0].1, Some(&rel));
    }

    let command = config
        .scripts
        .iter()
        .find(|(pattern, _)| glob_match(pattern, &rel))
        .map(|(_, command)| command.clone())
        .ok_or_else(|| format!("niketa: no script matches `{rel}`"))?;

    let is_lint = LINT_COMMANDS.iter().any(|candidate| *candidate == command);
    let file = if is_lint {
        rel
    } else {
        resolve_spec_path(worktree, &root, &rel)?.unwrap_or(rel)
    };

    exec_shell(worktree, &root, &command, Some(&file))
}

fn lint(worktree: &zed::Worktree, args: &[String]) -> zed::Result<String> {
    let root = worktree.root_path();
    do_lint(worktree, &root, &file_arg(args)?)
}

fn do_lint(worktree: &zed::Worktree, root: &str, rel: &str) -> zed::Result<String> {
    let command = format!("run fmt {}", shell_quote(rel));
    exec_shell(worktree, root, &command, None)
}

fn status(worktree: &zed::Worktree) -> zed::Result<String> {
    let root = worktree.root_path();
    let config = load_config(worktree, &root);
    let mut lines = Vec::new();

    if !config.named.is_empty() {
        lines.push(format!("script sets : {}", config.named.join(", ")));
        lines.push(format!(
            "active      : {}",
            config.active.as_deref().unwrap_or("none")
        ));
    }
    lines.push(format!("glob commands: {}", config.scripts.len()));
    for (pattern, command) in &config.scripts {
        lines.push(format!("  {pattern} -> {command}"));
    }
    if !config.legacy.is_empty() {
        lines.push(format!("legacy      : {}", config.legacy.len()));
        for (path, command) in &config.legacy {
            lines.push(format!("  {path} -> {command}"));
        }
    }
    lines.push(format!("root        : {root}"));

    Ok(lines.join("\n"))
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

fn file_arg(args: &[String]) -> zed::Result<String> {
    args.first()
        .filter(|arg| !arg.is_empty())
        .cloned()
        .ok_or_else(|| "niketa: pass a file path relative to the project root".to_string())
}

/// VS Code behavior: when the file has no `.spec.` yet a sibling `*.spec.*`
/// file exists, the test script runs against that instead.
fn resolve_spec_path(
    worktree: &zed::Worktree,
    root: &str,
    rel: &str,
) -> zed::Result<Option<String>> {
    if rel.contains(".spec.") {
        return Ok(Some(rel.to_string()));
    }
    let Some(dot) = rel.rfind('.') else {
        return Ok(None);
    };
    let spec = format!("{}.spec.{}", &rel[..dot], &rel[dot + 1..]);
    if read_project_file(worktree, root, &spec).is_ok() {
        Ok(Some(spec))
    } else {
        Ok(None)
    }
}

fn exec_shell(
    worktree: &zed::Worktree,
    root: &str,
    command: &str,
    file: Option<&str>,
) -> zed::Result<String> {
    let mut full = format!("{} {}", shell_quote(root), command);
    if let Some(file) = file {
        full.push(' ');
        full.push_str(&shell_quote(file));
    }
    let shell_command = format!("cd {full}");

    let mut proc = zed::process::Command::new("sh")
        .arg("-lc")
        .arg(&shell_command)
        .envs(worktree.shell_env());
    let output = proc
        .output()
        .map_err(|error| format!("niketa: failed to run `{shell_command}`: {error}"))?;

    let exit_code = output.status.unwrap_or(1);
    let mut stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    if stdout.is_empty() {
        stdout = "(no stdout)".to_string();
    }
    if !stderr.is_empty() {
        stdout = format!("{stdout}\n--- stderr ---\n{stderr}");
    }

    let status = if exit_code == 0 { "ok" } else { "FAILED" };
    Ok(format!("`{shell_command}` -> {status} (exit {exit_code})\n{stdout}"))
}

/// Reads `path`, which may be relative to the worktree root or absolute.
fn read_project_file(worktree: &zed::Worktree, root: &str, path: &str) -> Result<String, String> {
    worktree
        .read_text_file(path)
        .or_else(|_| worktree.read_text_file(&format!("{root}/{path}")))
}

fn shell_quote(value: &str) -> String {
    format!("'{}'", value.replace('\'', "'\\''"))
}

// ---------------------------------------------------------------------------
// glob matching (minimatch subset: `**`, `*`, `?`, literals)
// ---------------------------------------------------------------------------

fn glob_match(pattern: &str, path: &str) -> bool {
    let pattern: Vec<&str> = pattern.split('/').collect();
    let path: Vec<&str> = path.split('/').collect();
    match_segments(&pattern, &path)
}

fn match_segments(pattern: &[&str], path: &[&str]) -> bool {
    if pattern.is_empty() {
        return path.is_empty();
    }
    match pattern[0] {
        "**" => {
            for skip in 0..=path.len() {
                if match_segments(&pattern[1..], &path[skip..]) {
                    return true;
                }
            }
            false
        }
        segment => {
            if path.is_empty() || !match_segment(segment, path[0]) {
                return false;
            }
            match_segments(&pattern[1..], &path[1..])
        }
    }
}

fn match_segment(pattern: &str, segment: &str) -> bool {
    match_chars(pattern.as_bytes(), segment.as_bytes())
}

fn match_chars(pattern: &[u8], value: &[u8]) -> bool {
    if pattern.is_empty() {
        return value.is_empty();
    }
    match pattern[0] {
        b'*' => (0..=value.len()).any(|skip| match_chars(&pattern[1..], &value[skip..])),
        b'?' => !value.is_empty() && match_chars(&pattern[1..], &value[1..]),
        byte => !value.is_empty() && value[0] == byte && match_chars(&pattern[1..], &value[1..]),
    }
}