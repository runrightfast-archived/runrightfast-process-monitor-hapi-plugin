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
'use strict';

var expect = require('chai').expect;
var Hapi = require('hapi');

describe('Process Mpnitor Hapi Plugin', function() {

	it('can be added as a plugin to hapi - logDir option is required', function(done) {

		try {
			var options = {};

			var server = new Hapi.Server();
			server.pack.require('../', options, function(err) {
				expect(err).to.not.exist;
				done();
			});
			done(new Error('expected Error because logDir option was not specified'));
		} catch (err) {
			done();
		}
	});

	it('can be added as a plugin to hapi with logDir option', function(done) {

		var options = {
			logDir : 'logs'
		};

		var server = new Hapi.Server();
		server.pack.require('../', options, function(err) {
			expect(err).to.not.exist;
			done();
		});
	});

});