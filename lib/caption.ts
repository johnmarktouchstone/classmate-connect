export function formatInstagramHandle(handle: string) {
  const trimmedHandle = handle.trim();

  if (!trimmedHandle) {
    return "@yourhandle";
  }

  return trimmedHandle.startsWith("@") ? trimmedHandle : `@${trimmedHandle}`;
}

export function formatCaptionForInstagram(caption: string, instagramHandle: string) {
  const trimmedCaption = caption.trim();
  const handle = formatInstagramHandle(instagramHandle);

  if (!trimmedCaption) {
    return `Your caption will appear here.\n${handle}`;
  }

  return `${trimmedCaption}\n${handle}`;
}
