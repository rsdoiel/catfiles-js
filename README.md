catfiles.js
===========

A simple example to asynchronous file concatenation where the names and numbers of the discrete files are known in advance. 

# Problem

You want to have a simple way of concatenating file resources stored locally
and "getable" via http.  You don't want to block since this is written in JavaScript running in Node. How do you do this simply?


This is how the solution using it might work.

```JavaScript
    var cat = require("catfiles"),
        concatentated_content = "";
    
    cat.cat(["css/basic.css", "css/browsers.css", "css/custom.css"],
        function (err, buf) {
            if (err) {
                throw err;
            }
            // Here's out concatenated content
            console.log(buf.toString());
        });
```

## Local filesystem only

Implementation might look something like...

```JavaScript
    var fs = require("fs");

    exports.cat = function (filenames, callback) {
        var count = filenames.length,
            output = new Array(count),
            i = 0,
            processed = 0;
         
        function readFile(filename, output_index, callback) {
            fs.readFile(filename, function (err, buf) {
                var error_msg, i = 0, total_size = 0;
                if (err) {
                    error_msg = [filename, ": ", err].join(""); 
                    callback(error_msg, null);
                    return;
                }
                output[output_index] = buf;
                processed += 1;
                if (processed === count) {
                    // Get the length of the concatenated buffer you'll need
                    for (i = 0; i < output.length; i += 1) {
                        total_size += output[i].length;
                    }
                    // then pass new Buffer.concat(list, total_size);
                    // to the callback
                    callback(null, new Buffer.concat(output, total_size));
                }
            });
        }
        
        for (i = 0; i < count; i += 1) {
            readFile(filenames[i], i, callback);
        }
    };
```

## Remote files only

```JavaScript
    var url = require("url"),
        http = require("http"),
        https = require("https");

    exports.cat = function (urls, callback) {
        var count = urls.length,
            output = new Array(count),
            i = 0,
            processed = 0;
         
        function readFile(href, output_index, callback) {
            var parts = url.parse(href),
                ht;
            
            if (parts.protocol === "https") {
                ht = https;
            } else {
                ht = http;
            }
            
            ht.get(href, function (res) {
                var i = 0, total_size = 0;

                output[output_index] = "";
                res.on("data", function (chunk) {
                    output[output_index] = output[output_index] + chunk.toString();
                }).on("end", function () {
                    processed += 1;

                    if (processed === count) {
                        // Get the length of the concatenated buffer you'll need
                        for (i = 0; i < output.length; i += 1) {
                            total_size += output[i].length;
                        }
                        // then pass new Buffer.concat(list, total_size);
                        // to the callback
                        callback(null, new Buffer.concat(output, total_size));
                    }
                });
            }).on("error", function (err) {
                var error_msg;
                if (err) {
                    error_msg = [href, ": ", err].join(""); 
                    callback(error_msg, null);
                    return;
                }
            });
        }
        
        for (i = 0; i < count; i += 1) {
            readFile(urls[i], i, callback);
        }
    };
```

## Combining both local and remote files

Now let us put the pieces together and create a NodeJS/npm installable program.

[catfiles.js](catfiles.js)
```JavaScript
    /**
     * catfiles.js - An example NodeJS program for concatinating files.
     * @author R. S. Doiel, <rsdoiel@gmail.com>
     * copyright (c) 2013 all rights reserved
     * Released under the BSD 2-clause license. See: http://opensource.org/licenses/BSD-2-Clause
     */
    /*jslint node: true, indent: 4 */
    var fs = require("fs"),
        url = require("url"),
        http = require("http"),
        https = require("https");

    exports.cat = function (urls, callback) {
        var count = urls.length,
            output = new Array(count),
            i = 0,
            processed = 0;
         
        function readLocalFile(filename, output_index, callback) {
            fs.readFile(filename, function (err, buf) {
                var error_msg, i = 0, total_size = 0;
                if (err) {
                    error_msg = [filename, ": ", err].join(""); 
                    callback(error_msg, null);
                    return;
                }
                output[output_index] = buf;
                processed += 1;
                if (processed === count) {
                    // Get the length of the concatenated buffer you'll need
                    for (i = 0; i < output.length; i += 1) {
                        total_size += output[i].length;
                    }
                    // then pass new Buffer.concat(list, total_size);
                    // to the callback
                    callback(null, new Buffer.concat(output, total_size));
                }
            });
        }

        function readRemoteFile(href, output_index, callback) {
            var parts = url.parse(href),
                ht;
            
            if (parts.protocol === "https") {
                ht = https;
            } else {
                ht = http;
            }
            
            ht.get(href, function (res) {
                var i = 0, total_size = 0;

                res.on("data", function (buf) {
                    var total_size = 0;
                    if (output[output_index] === undefined) {
                        output[output_index] = buf;
                    } else {
                        total_size = output[output_index].length +
                            buf.length;
                        output[output_index] = Buffer.concat([
                            output[output_index],
                            buf], total_size);
                    }
                }).on("end", function () {
                    processed += 1;
                    if (processed === count) {
                        // Get the length of the concatenated buffer you'll need
                        for (i = 0; i < output.length; i += 1) {
                            total_size += output[i].length;
                        }
                        // then pass new Buffer.concat(list, total_size);
                        // to the callback
                        callback(null, new Buffer.concat(output, total_size));
                    }
                });
            }).on("error", function (err) {
                var error_msg;
                if (err) {
                    error_msg = [href, ": ", err].join(""); 
                    callback(error_msg, null);
                    return;
                }
            });
        }
        
        for (i = 0; i < count; i += 1) {
            if (urls[i].indexOf("://") > -1) {
                readRemoteFile(urls[i], i, callback);
            } else {
                readLocalFile(urls[i], i, callback);
            }
        }
    };
```

So we have a nice module for assembling concatenated content. What we are missing
is a simple wrapper to make a command line version.  For that I'll creeate _cli.js_
and add the _bin_ block in _package.json_.


[First we load our module](cli.js)
```JavaScript
    /**
     * catfiles-cli.js - An example NodeJS command line wrapper for catfile.js module.
     * @author R. S. Doiel, <rsdoiel@gmail.com>
     * copyright (c) 2013 all rights reserved
     * Released under the BSD 2-clause license. See: http://opensource.org/licenses/BSD-2-Clause
     */
    /*jslint node: true, indent: 4 */
    var cat = require("./catfiles").cat,
        filenames;

```


[Now get a list of files or display help](cli.js)
```JavaScript
    // get file list
    filenames = process.argv.slice(2);
    if (filenames.length === 0) {
        console.log("USAGE: catfiles FILENAME1 FILENAME2 ...");
        console.log("Display the contents of the files one after another.");
        process.exit(1);
    }
```

[Finally we use our filelist and catfiles cat method](cli.js)
```JavaScript
    cat(filenames, function (err, buf) {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        process.stdout.write(buf);
    });
```

Node's npm uses a _package.json_ file to control installation.

[package.json](package.json)
```JavaScript
    {
      "name": "catfiles-js",
      "version": "0.0.0",
      "description": "Instructional example to concatenating files in a simple NodeJS app.",
      "main": "catfiles.js",
      "bin": {
          "catfiles": "./cli.js"
      },
      "engines": {
          "node": "0.10.x",
          "npm": "1.2.x"
      },
      "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1"
      },
      "devDependencies": {
        "mweave": "0.0.x"
      },
      "repository": {
        "type": "git",
        "url": "git://github.com/rsdoiel/catfiles-js.git"
      },
      "keywords": [
        "demo",
        "javascript"
      ],
      "author": "R. S. Doiel, <rsdoiel@gmail.com>",
      "license": "BSD",
      "readmeFilename": "README.md",
      "gitHead": "7f8f9fccfe09aa782f76b547f102176010692850"
    }
```

# Installation

To install catfiles run the following _npm_ command--

``Shell
    sudo npm -g install catfiles
``

Now you should be able to use catfiles to output combined files.

