export function show(emit, message){
  emit({
    channel : 'show',
    message,
  })
}
