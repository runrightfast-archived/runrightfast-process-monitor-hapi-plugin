/**
 * Copyright [2013] [runrightfast.co]
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/**
 * wrapper around good (https://github.com/spumko/good) that provides the
 * following value adds:
 * 
 * <code>
 * - creates the specified logDir if it does not exist
 * - creates module sub dir under the logDir with the naming convention of : [module.name]-[module-version]
 * - in the module log dir, a log file for each of the good event types is created with the naming convention of:
 * 
 * 		[event]-[process.pid].log
 * 
 * NOTE: Each time the process is restarted, new log files will be created for the process.
 * 
 * NOTE: If the 'maxLogSize' option is set on the 'good' plugin, then the log file will be split.
 * 		 When split the log file extension will be incremented by 1. The initial log file has an extension of .001.
 * 
 * - TODO: cleans the log dir
 * - TODO: exposes endpoints to stream logs via web socket
 * 
 * </code>
 * 
 * @param options
 *            extends 'good' options
 * 
 * <code>
 *{
 *logDir : /logs								// OPTIONAL - defaults to ../../logs
 *maxLogSize:1024 * 1000 * 10,					// OPTIONAL - the maximum byte size to allow log files to become before creating a new log file.
 *															  When split, the log file extension will be incremented by 1. The initial log file has an extension of .001. 
 *															  Default is 10 mb.
 *}
 *</code>
 * 
 * NOTE: it is recommended that the log dir is external to app base dir and
 * symlinked to $app_base/logs
 * 
 */
module.exports.register = function(plugin, options, next) {
	'use strict';

	var lodash = require('lodash');
	var Hoek = require('hoek');
	var assert = Hoek.assert;
	var extend = require('extend');

	var logging = require('runrightfast-commons').logging;
	var pkgInfo = require('./pkgInfo');
	var logger = logging.getLogger(pkgInfo.name);

	var path = require('path');
	var parentPkgInfo = require('./parentPkgInfo');
	if (!parentPkgInfo.name) {
		parentPkgInfo = pkgInfo;
	}

	var logDir = path.join(__dirname, '..', '..', 'logs', parentPkgInfo.name + '-' + parentPkgInfo.version);

	/* default config */
	var config = {
		logDir : logDir,
		maxLogSize : 1024 * 1000 * 10
	};

	var validateConfig = function(config) {
		assert(lodash.isString(config.logDir), 'logDir is required and its type must be String');
	};

	/**
	 * Used to select servers to configure based on server labels. By default,
	 * it returns back the plugin
	 */
	// var selection = function(config) {
	// if (lodash.isArray(config.serverLabels) ||
	// lodash.isString(config.serverLabels)) {
	// return plugin.select(config.serverLabels);
	// }
	// return plugin;
	// };
	/**
	 * <code>
	 * - creates the specified logDir if it does not exist
	 * - creates module sub dir under the logDir with the naming convention of : [module.name]-[module-version]
	 * - in the module log dir, a log file for each of the good event types is created with the naming convention of:
	 * 
	 * 		[event]-[process.pid].log
	 * 
	 * NOTE: Each time the process is restarted, new log files will be created for the process.
	 * 
	 * NOTE: If the 'maxLogSize' option is set on the 'good' plugin, then the log file will be split.
	 * 		 When split the log file extension will be incremented by 1. The initial log file has an extension of .001.
	 * 
	 * </code>
	 */
	var addLogFileSubscribers = function() {
		var logDir = config.logDir;
		var assert = require('assert');
		var lodash = require('lodash');
		assert(lodash.isString(logDir), 'logDir is required');

		var path = require('path');

		var subscribers = config.subscribers || {
			console : []
		};

		var file = require("file");
		var fs = require('fs');
		var stats;
		try {
			stats = fs.statSync(logDir);
		} catch (err) {
			console.log(err);
			file.mkdirsSync(logDir, parseInt('0755', 8));
			stats = fs.statSync(logDir);
		}

		if (!stats.isDirectory()) {
			throw new Error('log dir is not actually a directory: ' + logDir);
		}

		Object.defineProperty(subscribers, path.join(logDir, 'ops.' + process.pid + '.log'), {
			value : [ 'ops' ],
			enumerable : true
		});
		Object.defineProperty(subscribers, path.join(logDir, 'request.' + process.pid + '.log'), {
			value : [ 'request' ],
			enumerable : true
		});
		Object.defineProperty(subscribers, path.join(logDir, 'log.' + process.pid + '.log'), {
			value : [ 'log' ],
			enumerable : true
		});
		Object.defineProperty(subscribers, path.join(logDir, 'error.' + process.pid + '.log'), {
			value : [ 'error' ],
			enumerable : true
		});

		if (logger.isInfoEnabled()) {
			logger.info(subscribers);
		}
	};

	var registerPlugin = function() {
		addLogFileSubscribers();
		plugin.require('good', config, function(err) {
			console.error('Failed to register plugin : ' + pkgInfo.name + ' : ' + err);
			throw err;
		});
	};

	extend(true, config, options);
	logging.setLogLevel(logger, config.logLevel);
	if (logger.isDebugEnabled()) {
		logger.debug(config);
	}
	validateConfig(config);
	registerPlugin();

	next();

};