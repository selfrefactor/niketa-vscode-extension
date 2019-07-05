export function tooltip(emit, message){
  emit({
    channel : 'tooltip',
    message,
  })
}
