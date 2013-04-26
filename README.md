catfiles.js
===========

A simple example to asynchronous file concatenation where the names and numbers of the discrete files are known in advance. 

# Problem

You want to have a simple way of concatenating file resources stored locally
and "getable" via http.  You don't want to block since this is written in JavaScript running in Node. How do you do this simply?

## Approach number 1

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
                    error_msg = [filename, ": ", err].join(""): 
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
                    // them run Buffer.concat(list, total_size);
                    callback(null, new Buffer.concat(output, total_size));
                }
            });
        }
        
        for (i = 0; i < count; i += 1) {
            readFile(filenames[i], i, callback);
        }
    };
```
