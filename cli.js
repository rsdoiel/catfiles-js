#!/usr/bin/env node
/**
 * catfiles-cli.js - An example NodeJS command line wrapper for catfile.js module.
 * @author R. S. Doiel, <rsdoiel@gmail.com>
 * copyright (c) 2013 all rights reserved
 * Released under the BSD 2-clause license. See: http://opensource.org/licenses/BSD-2-Clause
 */
/*jslint node: true, indent: 4 */
var cat = require("./catfiles").cat,
    filenames;

// get file list
filenames = process.argv.slice(2);
if (filenames.length === 0) {
    console.log("USAGE: catfiles FILENAME1 FILENAME2 ...");
    console.log("Display the contents of the files one after another.");
    process.exit(1);
}
cat(filenames, function (err, buf) {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    process.stdout.write(buf);
});