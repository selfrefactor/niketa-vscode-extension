const { exec } = require('helpers')

void async function foo(){
  const a = await exec({
    cwd     : __dirname,
    command : 'npx -p @babel/core -p @babel/node babel-node&&npx babel-node b.js', //${}
  })
  console.log(a)
}()
