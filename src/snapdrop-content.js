window.addEventListener('file-received', function(e) {
  const file = e.detail;
  console.log("SNAPDROP-CONTENT:", file)
  const reader = new FileReader();
  reader.onload = function() {
    window.parent.postMessage({
      type: "file-received",
      file: file.blob,
      mime: file.mime,
      name: file.name,
      dataURL: reader.result
    }, "*");
  };
  reader.readAsDataURL(file.blob);
});

