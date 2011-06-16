desc('Show tasks');
task('default', [], function(params) {
    var exec = require('child_process').exec;
    exec('jake -T', function(error, stdout, stderr) {
        console.log(stdout);
    })
});

desc('Glue and compress javascript client');
task('compressJs', [], function(params) {
    var fs = require('fs'),
        cp = require('child_process');

    var javascript = '(function() {\n';

	[	'shiterator.js',
        'errorstorage.js',
        'errorhandler.js',
		'jsontostring.js',
        'utils.js'
	].forEach(function(file) {
		javascript += fs.readFileSync('./clients/js/lib/' + file) + "\n\n";
	});

    javascript += '})();\n\n';

    fs.writeFile('./clients/js/shiterator.js', javascript);

    console.log('shiterator.js created.');

    cp.exec('java -jar ' + __dirname + '/vendor/compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS --js ' + __dirname + '/clients/js/shiterator.js --js_output_file ' + __dirname + '/clients/js/shiterator.min.js', function (error, stdout, stderr) {
        if (error !== null) {
            console.log(error);
        } else {
            console.log('shiterator.min.js created.');
        }
    });
});