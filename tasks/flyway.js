/*
 * grunt-flyway
 * https://github.com/bgaillard/grunt-flyway
 *
 * Copyright (c) 2013 Baptiste Gaillard
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

    var ChildProcess = require('child_process'),
        Util = require('util'),
        Os = require('os'),
        Path = require('path');

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks
    grunt.registerMultiTask('flyway', 'Your task description goes here.', function() {

        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options();

        var done = this.async();

        var flywayBinPath = Path.resolve(__dirname, '../flyway-commandline-2.1.1/bin');

        var classPathSeparator = ';';

        if(Os.platform() === 'linux' || Os.platform() === 'darwin') {
            classPathSeparator = ':';
        }

        var javaClasspath = flywayBinPath + '/flyway-commandline-2.1.1.jar' + classPathSeparator;
        javaClasspath = javaClasspath + flywayBinPath + '/flyway-core-2.1.1.jar';

        var availableCommands = {
            clean: {
                url: {
                    required: true
                },
                driver: {},
                user: {},
                password: {},
                schemas: {},
                jarDir: {}
            },
            init: {
                url: {
                    required: true
                },
                driver: {},
                user: {},
                password: {},
                schemas: {},
                table: {},
                jarDir: {},
                initVersion: {},
                initDescription: {}
            },
            migrate: {
                url: {
                    required: true
                },
                driver: {},
                user: {},
                password: {},
                schemas: {},
                table: {},
                locations: {},
                jarDir: {},
                sqlMigrationPrefix: {},
                sqlMigrationSuffix: {},
                encoding: {},
                placeholders: {
                    isObject: true
                },
                placeholderPrefix: {},
                placeholderSuffix: {},
                target: {},
                outOfOrder: {},
                validateOnMigrate: {},
                cleanOnValidationError: {},
                initOnMigrate: {},
                initVersion: {},
                initDescription: {}
            },
            validate: {
                url: {
                    required: true
                },
                driver: {},
                user: {},
                password: {},
                schemas: {},
                table: {},
                locations: {},
                jarDir: {},
                sqlMigrationPrefix: {},
                sqlMigrationSuffix: {},
                encoding: {},
                placeholders: {
                    isObject: true
                },
                placeholderPrefix: {},
                placeholderSuffix: {},
                target: {},
                outOfOrder: {},
                cleanOnValidationError: {}
            }
        };

        // Checks if the provided Flyway command name is valid
        if(!availableCommands.hasOwnProperty(this.data.command)) {

            grunt.log.error(Util.format('Flyway does not provide any command named \'%s\'!', this.data.command));

            return done(false);

        }

        var flywayCommand = 'java -cp ' + javaClasspath + ' com.googlecode.flyway.commandline.Main ' + this.data.command;

        var commandOptions = availableCommands[this.data.command];

        for (var option in options) {

            if (options.hasOwnProperty(option) && !commandOptions.hasOwnProperty(option)) {

                grunt.log.error(Util.format('Flyway does not provide option \'%s\' for command named \'%s\'!',
                    option,
                    this.data.command));

                return done(false);

            }

        }

        for (option in commandOptions) {

            if (commandOptions.hasOwnProperty(option)) {

                if (options.hasOwnProperty(option)) {

                    if (commandOptions[option].isObject) {

                        /*
                            Handling of object-type options. Currently it's only `placeholders`.

                            Configuration written as:
                            placeholders: {
                              name1: 'value1',
                              name2: 'value2'
                            }

                            is added to command string as:
                            -placeholders.name1="value1" -placeholders.name2="value2"
                         */

                        Object.keys(options[option]).forEach(function (parameter) {

                            flywayCommand += Util.format(' -%s.%s="%s"', option, parameter, options[option][parameter]);

                        });

                    } else {

                        flywayCommand += Util.format(' -%s="%s"', option, options[option]);

                    }

                } else if (commandOptions[option].required) {

                    grunt.log.error(Util.format('Flyway requires option \'%s\' to be set for command named \'%s\'!',
                        option,
                        this.data.command));

                    return done(false);

                }

            }

        }

        grunt.log.write(flywayCommand);

        var childProcess = ChildProcess.exec(flywayCommand, function(error, stdout, stderr) {

            grunt.log.writeln();
            grunt.log.writeln(error);
            grunt.log.writeln(stdout);
            grunt.log.writeln(stderr);

            if(stdout.indexOf('ERROR: FlywayException: Unable to obtain Jdbc connection from DataSource') !== -1) {

                var databaseName = options.url.substring(options.url.lastIndexOf('/') + 1);

                grunt.log.writeln('The connection to your database has failed, is your connection configuration set properly?');
                grunt.log.writeln();
                grunt.log.writeln('Here are the parameters your are using to connect to your database:');
                grunt.log.writeln('  url=' + options.url);
                grunt.log.writeln('  user=' + options.user);
                grunt.log.writeln('  password=' + options.password);

                grunt.log.writeln();
                grunt.log.writeln('If your database connection configuration parameters are valid verify that your database exist.');
                grunt.log.writeln('To create your database you could use the following SQL script:');
                grunt.log.writeln();
                grunt.log.writeln('  -- Creates the database');
                grunt.log.writeln('  create database ' + databaseName + ' default char set UTF8;');
                grunt.log.writeln('  use ' + databaseName + ';');
                grunt.log.writeln();
                grunt.log.writeln('  -- Creates the user used to connect to the database with the right grants');
                grunt.log.writeln('  grant all privileges on ' + databaseName + '.* to \'' + options.user + '\'@\'localhost\' identified by \'' + options.password + '\';');
                grunt.log.writeln('  flush privileges;');
                grunt.log.writeln();

            }

        });

        childProcess.on('exit', function(code) {

            if (code > 0) {

                grunt.log.error(Util.format('Exited with code: %d.', code));

                return done(false);

            }

            grunt.verbose.ok(Util.format('Exited with code: %d.', code));
            return done();
        });

    });
};