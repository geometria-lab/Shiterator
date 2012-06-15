#!/usr/bin/env node

var fs         = require('fs'),
    path       = require('path'),
    program    = require('commander'),
    mongoose   = require('mongoose');

var packageJson = fs.readFileSync(__dirname + '/../package.json', 'utf8'),
    packageInfo = JSON.parse(packageJson);

function configExists(config) {
    return path.existsSync(config);
}

function getShiterator() {
    var Shiterator  = require('../lib/shiterator.js'),
        optionsJson = fs.readFileSync(program.config, 'utf8'),
        options     = JSON.parse(optionsJson);

    return new Shiterator(options);
}

program
    .version(packageInfo.version)
    .option('-c, --config <json file>', 'Configuration file [Default config]', configExists, __dirname + '/../config.json');

program
    .command('start')
    .description('Run shiterator')
    .action(function() {
        getShiterator().listen();
    });

program
    .command('project-add [title] [secret]')
    .description('Project: add new')
    .action(function(title, secret) {
        getShiterator();

        var Project = mongoose.model('Project');
        var project = new Project;
        project.title = title;
        project.secret = secret;
        project.save(function(err){
            if (err) {
                console.log('Error: ' + e.message);
                process.exit(1);
            } else {
                console.log(project.id);
                process.exit();
            }
        });
    });
//
//http:///
program
    .command('project-list')
    .description('Project: list all')
    .action(function() {
        getShiterator();

        var Project = mongoose.model('Project');
        Project.find({}, function(err, docs){
            if (err) {
                console.log('Error: ' + e.message);
                process.exit(1);
            } else {
                docs.forEach(function(project) {

                    console.log(project.id + ' => ' + project.title + ': ' + JSON.stringify(project.trackerLinks));
                });
                process.exit();
            }
        })
    });

program
    .command('project-link [id] [tracker] [optionsJson]')
    .description('Project: list all')
    .action(function(id, tracker, optionsJson) {
        getShiterator();

        var Project = mongoose.model('Project');
        Project.findById(id, function(err, doc){
            doc.trackerLinks.push({
                tracker: tracker,
                options: JSON.parse(optionsJson)
            });
            doc.save(function(err){
                if (err) {
                    console.log('Error: ' + e.message);
                    process.exit(1);
                } else {
                    console.log('Added');
                    process.exit();
                }
            });
        });

    });

program.parse(process.argv);