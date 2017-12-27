const piexif = require("piexifjs"),
  fs = require("fs-extra"),
  im = require("imagemagick"),
  klaw = require('klaw'),
  path = require('path'),
  c = require('chalk'),
  supportedExtensions = [".jpg",".jpeg",".tiff"];

const dataThatNeedsToBeDecoupled = {
  inDir: "C:\\Data\\exif_editor_test_dir",
  mapping: {
    zeroth: [
      {
        name: "author",
        value: "Author Value"
      },
      {
        name: "title",
        value: "Title Value"
      },
      {
        name: "subject",
        value: 'Subject Value'
      }
    ],
    exif: []
  }
}
init();
function init() {
  updateAllFiles();
}

function updateAllFiles() {
  // get all matching files in directory first
  let matchingFiles = [],invalidFiles=0;
  klaw(dataThatNeedsToBeDecoupled.inDir)
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
              for (let i=0;i<dataThatNeedsToBeDecoupled.mapping.zeroth.length;i++) {
                switch(dataThatNeedsToBeDecoupled.mapping.zeroth[i].name) {
                  case "author":
                    zeroth[piexif.ImageIFD.Artist] = dataThatNeedsToBeDecoupled.mapping.zeroth[i].value;
                    zeroth[piexif.ImageIFD.XPAuthor] = generateCharCodeArray(dataThatNeedsToBeDecoupled.mapping.zeroth[i].value);
                    break;
                  case "subject":
                    zeroth[piexif.ImageIFD.XPSubject] = generateCharCodeArray(dataThatNeedsToBeDecoupled.mapping.zeroth[i].value);
                    break;
                  case "title":
                    zeroth[piexif.ImageIFD.ImageDescription] = dataThatNeedsToBeDecoupled.mapping.zeroth[i].value;
                    zeroth[piexif.ImageIFD.XPTitle] = generateCharCodeArray(dataThatNeedsToBeDecoupled.mapping.zeroth[i].value);
                    break;
                  case "tags":
                    zeroth[piexif.ImageIFD.XPKeywords] = generateCharCodeArray(dataThatNeedsToBeDecoupled.mapping.zeroth[i].value);
                    break;
                  default:
                    console.log(c.yellow(`property ${dataThatNeedsToBeDecoupled.mapping.zeroth[i].name} not yet supported`))
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
