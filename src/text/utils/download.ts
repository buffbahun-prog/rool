export function downloadTextAsFile(text: string, filename = "rool.txt") {
    const blob = new Blob([text], {type: "text/plain"});
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}