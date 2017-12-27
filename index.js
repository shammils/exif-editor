const piexif = require("piexifjs"),
  fs = require("fs-extra"),
  im = require("imagemagick");

var inImage = "C:\\Users\\skyler.hamilton\\Pictures\\20170605_112040.jpg";
var outImage = "out.jpg";

var mapping = {
  tags: {sect1: "0th", sect2: "40094", format: "int"},
  author: {sect1: "0th", sect2: "315", format: "string"},
  comment: {sect1: "0th", sect2: "40092", format: "int"},
  title: {sect1: "0th", sect2: "270", format: "string"}
}
fs.readFile(inImage,(err,image)=>{
  if (err) throw err;
  else {
    var data = image.toString("binary");
    var exifObj = piexif.load(data);
    //console.log(`data: ${JSON.stringify(exifObj)}`);
  }
});

function generateCharCodeArray(string) {
  // add a 0 after ever char
  // add a 0(whitespace) at the end of string
  var array = [];
  for (let i=0;i<string.length;i++) {
    array.push(string.charCodeAt(i));
    array.push(0);
  }
  array.push(0);
  array.push(0);
  return array;
}

function generateString(array) {
  var string = "";
  for (let i=0;i<arr.length;i++) {
    if (arr[i] > 0) {
      string += String.fromCharCode(array[i]);
    }
  }
  return string;
}
