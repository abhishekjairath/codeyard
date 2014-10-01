'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  crypto = require('crypto');

/*
 *Changes Schema
*/
var ChangesSchema = new Schema({
  file: String,
  updations:[{
    line: Number,
    content_now: String,
    content_then: String,
    status: Number
  }]
});
/**
 * Commit Schema
 */

var CommitSchema = new Schema({
  created:{
    type: Date,
    default: Date.now
  },
  updated:{
    type: Date,
    default: Date.now
  },
  contributor:{
    name:String,
    user:{
      type: Schema.ObjectId,
      ref: 'User'
    },
    photo: String
  },
  repo:{
    type: Schema.ObjectId,
    ref: 'Repo'
  },
  changes: [{ChangesSchema}]
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
mongoose.model('Commit', CommitSchema);
