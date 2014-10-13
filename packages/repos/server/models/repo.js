'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  crypto = require('crypto');


/**
 * Repo Schema
 */

var RepoSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  slug:{
    type: String,
    unique: true
  },
  created:{
    type: Date,
    default: Date.now
  },
  updated:{
    type: Date,
    default: Date.now
  },
  owner:{
    type: Schema.ObjectId,
    ref: 'User'
  },
  contributors:[{
    type: Schema.ObjectId,
    ref: 'User'
  }],
  ispublic:Boolean,
  desc: String,
  files:[{
    path:String,
    name:String,
    tag: String
  }]
});

/**
 * Methods
 
UserSchema.methods = {

  /**
   * HasRole - check if the user has required role
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   
  hasRole: function(role) {
    var roles = this.roles;
    return roles.indexOf('admin') !== -1 || roles.indexOf(role) !== -1;
  },

  /**
   * IsAdmin - check if the user is an administrator
   *
   * @return {Boolean}
   * @api public
   
  isAdmin: function() {
    return this.roles.indexOf('admin') !== -1;
  },

  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   
  authenticate: function(plainText) {
    return this.hashPassword(plainText) === this.hashed_password;
  }
  
};
*/
mongoose.model('Repo', RepoSchema);

