define(['base', 'resolver/model', 'backbone'], function (Base, helpers, Backbone) {
    'use strict';

    var Proxy = Base.extend({

        constructor: function(ctx) {
            this.ctx = ctx;
        },

        sync: function(method, options) {
            var self = this,
                model = this,
                type = helpers.methodMap[method];

            options = _(options).clone();

            // Replace options.error with a wrapper.
            var error = options.error;
            options.error = function (jqXHR) {
                if (error) {
                    var resp = {
                        statusCode: jqXHR.status,
                        headers: jqXHR.getAllResponseHeaders(),
                        body: jqXHR.responseText
                    };
                    error(resp);
                }
            };

            // Replace options.success with a wrapper.
            var success = options.success;
            options.success = function (resp, textStatus, jqXHR) {
                if (!resp || !resp.data) {
                    return options.error(jqXHR);
                }

                if (success && resp) {
                    success(resp.data);
                }
            };


            if (!this.name) {
                return error({Error: 'This model has no name set.  Cannot call the server'});
            }

            // Default JSON-request options.
            var params = {
                type:'POST',
                url:'/tunnel',
                dataType:'json',
                contentType:'application/json',
                processData: false
            };

            // assemble the data for the request
            var data = {
                method: type,
                crumb: self.ctx._rootCtx.cookies.crumb,
                params: this.params
            };

            if (this instanceof Backbone.Model) {
                data.model = this.name;
            }
            else {
                data.collection = this.name;
            }

            // include the model in the data bindings for create, update or patch type requests
            //  note that the model attributes will overwrite any bindings if they are named the same
            if (model && (method === 'create' || method === 'update' || method === 'patch' || method === 'delete')) {
                data.attributes = model.toJSON(options);
            }

            params.data = JSON.stringify(data);

            var xhr = $.ajax(_.extend(params, options));
            model.trigger('request', model, xhr, options);
            return xhr;

        },

        callSyncher: function(fname, args, options) {
            var self = this;
            var model = this.toJSON();

            options = _(options).clone();

            // Replace options.error with a wrapper.
            var error = options.error;
            options.error = function (xhr) {
                if (error) {
                    error(xhr);
                }
            };

            // Replace options.success with a wrapper.
            var success = options.success;
            options.success = function (resp, textStatus, jqXHR) {
                if (!resp) {
                    return options.error(jqXHR);
                }

                if (success && resp) {
                    success(resp);
                }
            };


            if (!fname) {
                return options.error({Error: 'Method/function to call not set.'});
            }

            // Default JSON-request options.
            var params = {
                type:'POST',
                url:'/tunnel',
                dataType:'json',
                contentType:'application/json',
                processData: false
            };

            // assemble the data for the request
            var data = {
                method: 'NONCRUD',
                crumb: self.ctx._rootCtx.cookies.crumb,
                params: this.params,
                attributes: model,
                fname: fname,
                args:args
            };

            if (this instanceof Backbone.Model) {
                data.model = this.name;
            }
            else {
                data.collection = this.name;
            }

            params.data = JSON.stringify(data);

            var xhr = $.ajax(_.extend(params, options));
        }

    });

    return Proxy;
});