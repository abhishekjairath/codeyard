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
    tag: String,
    size: Number,
    slug:{
      type:String,
      default:null
    }
  }],
  commits:[{
    type: Schema.ObjectId,
    ref: 'Commit'
  }]
});

mongoose.model('Repo', RepoSchema);