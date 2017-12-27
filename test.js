const piexif = require("piexifjs"),
  fs = require("fs-extra"),
  im = require("imagemagick"),
  klaw = require('klaw'),
  path = require('path'),
  c = require('chalk');

var inImage = "C:\\Users\\skyler.hamilton\\Pictures\\20170605_112040.jpg";
var inDir = "C:\\Data\\exif_editor_test_dir";
var outDir = "C:\\Data\\exif_editor_test_dir_out";
var outImage = "out.jpg";
var supportedExtensions = [".jpg",".jpeg",".tiff"]
/*
ImageDescription:270,
Artist:315,
Copyright:33432,
XPTitle:40091,
XPComment:40092,
XPAuthor:40093,
XPKeywords:40094,
XPSubject:40095,
*/
var mapping = {
  zeroth: [
    {
      name: "author",
      value: "Picture Corp"
    },
    {
      name: "title",
      value: "Some TITLE"
    },
    {
      name: "subject",
      value: 'Tether'
    }
  ],
  exif: []
}
init();
function init() {
  fs.ensureDir(outDir, err => {
    if (err) throw err;
    else updateAllFiles();
  })
}

function updateAllFiles() {
  // get all matching files in directory first
  let matchingFiles = [],invalidFiles=0;
  klaw(inDir)
    .on('data', (item) => {
      let obj = path.parse(item.path);
      if (~supportedExtensions.indexOf(obj.ext)) matchingFiles.push(item.path);
      else invalidFiles++;
    })
    .on('end', () => {
      if (matchingFiles.length > 0) {
        console.log(`${matchingFiles.length} out of ${matchingFiles.length+invalidFiles} will be updated`);
        updateExif(0);
      } else {
        console.log(`0 out of ${invalidFiles} can be updated`);
      }
    })
    function updateExif(index) {
      // update the exif
      if (index < matchingFiles.length) {
        try {
          fs.readFile(matchingFiles[index],(err,image) =>{
            if (err) {
                console.log(`${c.yellow("error reading image "+matchingFiles[index])}${c.red.bold(err)}`);
                updateExif(index+1);
            } else {
              var data = image.toString("binary");
              var exifObj = piexif.load(data);

              var zeroth = {};
              var exif = {};
              var gps = {};
              // we only update zeroth at the moment
              console.log(`zeoth length: ${mapping.zeroth.length}`)
              for (let i=0;i<mapping.zeroth.length;i++) {
                switch(mapping.zeroth[i].name) {
                  case "author":
                    zeroth[piexif.ImageIFD.Artist] = mapping.zeroth[i].value;
                    zeroth[piexif.ImageIFD.XPAuthor] = generateCharCodeArray(mapping.zeroth[i].value);
                    break;
                  case "subject":
                    zeroth[piexif.ImageIFD.XPSubject] = generateCharCodeArray(mapping.zeroth[i].value);
                    break;
                  case "title":
                    zeroth[piexif.ImageIFD.ImageDescription] = mapping.zeroth[i].value;
                    zeroth[piexif.ImageIFD.XPTitle] = generateCharCodeArray(mapping.zeroth[i].value);
                    break;
                  case "tags":
                    zeroth[piexif.ImageIFD.XPKeywords] = generateCharCodeArray(mapping.zeroth[i].value);
                    break;
                  default:
                    console.log(c.yellow(`property ${mapping.zeroth[i].name} not yet supported`))
                    break;
                }
              }
              // time to save
              var exifObj = {"0th":zeroth, "Exif":exif, "GPS":gps};
              var exifbytes = piexif.dump(exifObj);

              var newData = piexif.insert(exifbytes, data);
              var newJpeg = new Buffer(newData, "binary");
              fs.writeFile(matchingFiles[index], newJpeg, (err) => {
                if (err) {
                    console.log(`${c.yellow("error writing image "+matchingFiles[index])}${c.red.bold(err)}`);
                } else {
                  console.log(`updated file ${matchingFiles[index]}`)
                }
                updateExif(index+1);
              });
            }
          })
        } catch(err) {
          console.log(`${c.yellow("error updating "+matchingFiles[index])}${c.red.bold(err)}`);
          process.exit(0); // TODO: remove this line after successful runs
          updateExif(index+1);
        }
      } else {
        // done deal
        console.log(`completed task I think`)
      }
    }
}

function updateSingleFile() {
  fs.readFile(inImage,(err,image)=>{
    if (err) throw err;
    else {
      var data = image.toString("binary");
      var exifObj = piexif.load(data);

      var zeroth = {};
      var exif = {};
      var gps = {};
      // update info here(Artist and XPAuthor at least)
      var author = "me homie";
      var title = "new title"
      zeroth[piexif.ImageIFD.Artist] = author;
      zeroth[piexif.ImageIFD.XPAuthor] = generateCharCodeArray(author);
      zeroth[piexif.ImageIFD.ImageDescription] = "new title";
      zeroth[piexif.ImageIFD.XPTitle] = generateCharCodeArray("new title");
      // this only adds tags, not replaces them.
      // TODO: figure out how to replace
      zeroth[piexif.ImageIFD.XPKeywords] = generateCharCodeArray("new;tags");
      zeroth[piexif.ImageIFD.XPSubject] = generateCharCodeArray("nature");

      // save data here
      var exifObj = {"0th":zeroth, "Exif":exif, "GPS":gps};
      var exifbytes = piexif.dump(exifObj);

      var newData = piexif.insert(exifbytes, data);
      var newJpeg = new Buffer(newData, "binary");
      fs.writeFile(outImage, newJpeg, (err) => {
        if (err) throw err;
        else console.log("success, file is out.jpg")
      });
    }
  })
}

//im.readMetadata(inImage, function(err, metadata){
//  if (err) throw err;
//  console.log('Shot at '+metadata.exif.dateTimeOriginal);
//})

// generate char code array for saving
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
var depricated = {
  tags: [
    {sect1: "0th", sect2: "40094", format: "int"}
  ],
  subject: [
    {sect1: "0th", sect2: "40095", format: "int"}
  ],
  dateTaken: [
    {sect1: "0th", sect2: "306", format: "int"},
    {sect1: "Exif", sect2: "36867", format: "int"},
    {sect1: "Exif", sect2: "36868", format: "int"}
  ],
  dateAquired: [
    {sect1: "0th", sect2: "40095", format: "int"}
  ],
  copyright: [
    {sect1: "0th", sect2: "33432", format: "int"}
  ],
  authors: [
    {sect1: "0th", sect2: "315", format: "string"},
    {sect1: "0th", sect2: "40093", format: "int"}
  ],
  comment: [
    {sect1: "0th", sect2: "40092", format: "int"}
  ],
  title: [
    {sect1: "0th", sect2: "270", format: "string"},
    {sect1: "0th", sect2: "40091", format: "int"}
  ]
};

/*var arr = [115,
		0,
		117,
		0,
		98,
		0,
		106,
		0,
		101,
		0,
		99,
		0,
		116,
		0,
		0,
		0];
// get string from char codes
var tags = generateString(arr);
console.log(tags);

var newArr = generateCharCodeArray("test;fub");
console.log(newArr);*/
