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

            output[output_index] = "";
            res.on("data", function (chunk) {
                output[output_index] += chunk;
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