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
  desc:String,
  created:{
    type: Date,
    default: Date.now
  },
  contributor:{
    username: String,
    userid:{
      type: Schema.ObjectId,
      ref: 'User'
    }
  },
  repo:{
    reposlug:String,
    repoid:{
      type: Schema.ObjectId,
      ref: 'Repo'
    }
  },
  changes: [ChangesSchema]
});

mongoose.model('Commit', CommitSchema);