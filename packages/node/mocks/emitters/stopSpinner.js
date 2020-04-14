export function stopSpinner(emit){
  emit({
    channel : 'stopSpinner',
    message : '',
  })
}
