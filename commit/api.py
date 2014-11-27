#!/usr/bin/python

import os
from pymongo import MongoClient 
from hotqueue import HotQueue
import json
import datetime
from bson.objectid import ObjectId
import collections
import difflib
import threading
import redis

def replace(oldfile,newfile):
	f=open(oldfile,'w')
	g=open(newfile,'r')
	text=g.read()
	f.write(text)
	f.close()
	g.close()
	os.remove(newfile)

def func(name,path,isnew,extension,db,repoid,file_dir):
	d={}
	path=path+"/"
	addedfinal={}
	deletedfinal={}
	adddelete={}
	updations=[]
	if isnew == "false":
		file1=open(file_dir+path+name,'r')
		file2=open(file_dir+path+"temp_"+name,'r')
		read1=file1.readlines()
		read2=file2.readlines()
		file1.close()
		file2.close()
		change=difflib.ndiff(read1,read2)
		changes=[]
		for line in change:
			changes.append(line)
		#print changes
		l=0
		i=0
		j=0
		while l<len(changes):
			if changes[l][0]=='+':
				i=i+1
				addedfinal={'content_then':None,'content_now':changes[l][2:],'line_then':None,'line_now':i,'status':0}
				updations.append(addedfinal)
			elif changes[l][0]=='-':
				if l+2<len(changes):
					if changes[l+2][0]=='?':
						i=i+1
						j=j+1
						adddelete={'content_then':changes[l][2:],'content_now':changes[l+1][2:],'line_then':j,'line_now':i,'status':2}
						updations.append(adddelete)
						l=l+2
				else:
					j=j+1
					deletedfinal={'content_then':changes[l][2:],'content_now':None,'line_then':j,'line_now':None,'status':1}
					updations.append(deletedfinal)	
			else:
				i=i+1
				j=j+1	
			l=l+1
		
		replace(file_dir+path+name,file_dir+path+"temp_"+name)
		filesize=os.path.getsize(file_dir+path+name)
		db.repos.update({'_id':ObjectId(repoid),'files.path':path+name},{'$set':{'files.$.size':filesize,'updated':datetime.datetime.utcnow()}})
		

	else:
		o=open(file_dir+path+"temp_"+name,'r')
		addedfinal=o.readlines()
		o.close()
		os.rename(file_dir+path+"temp_"+name,file_dir+path+name)	
		i=0
		while i<len(addedfinal):
			b={}
			b={'content_then':None,'content_now':addedfinal[i],'line_then':None,'line_now':i+1,'status':0}
			updations.append(b)
			i=i+1

		filesize = os.path.getsize(file_dir+path+name)
		fileupdate={'path':path+name,'tag':extension,'name':name,'size':filesize,'slug':None,'_id':ObjectId()}
		db.repos.update({'_id':ObjectId(repoid)},{'$push':{'files':fileupdate,'updated':datetime.datetime.utcnow()}})
	d['file']=name
	d['updations']=updations
	
	
	return d




#a = '{"file":[{"isnew":"true","name":"tes4.c","path":"Realtime","extension":"c"}],"desc":"abcd","repoid":"54548e99cf45ddfac9d2579a","reposlug":"Realtime","userid":"546dd1f46e8610418688fd26","username":"aman"}'


	


def Main():


	print "\nredis-listener started "

	setupfile=open("config.json",'r')
	info=setupfile.read()
	info=json.loads(info)
	HOST=info['mongohost']
	PORT=info['port']
	DB_NAME=info['database_name']
	LISTENER_QUEUE=info['listener_queue']
	RESPONSE_QUEUE=info['response_queue']

	file_dir=info['repo_directory']
	client = MongoClient(HOST,PORT)
	
	db = client[DB_NAME]
	
	listen = HotQueue(LISTENER_QUEUE,serializer=json)

	response = HotQueue(RESPONSE_QUEUE,serializer=json)

	r = redis.StrictRedis(host='localhost', port=6379, db=0)

	for a in listen.consume():
		
		files = []
		for item in a['files']:
			files.append(func(item['name'],item['path'],item['isnew'],item['extension'],db,a['repoid'],file_dir))
		
		commits = {
					'changes'  : files,
					'desc'     : a['desc'],
					'created'  : datetime.datetime.utcnow(),
					#'comment'  : [],
					'repo'     : {'id':ObjectId(a['repoid']),'slug':a['reposlug']},
					'user'     : {'id':ObjectId(a['userid']),'username':a['username']}
				}

		commitid = db.commits.insert(commits)
		
		db.repos.update({'_id':commits['repo']['id']},{'$push':{'commits':commitid}})
		
		db.users.update({'_id':commits['user']['id']},{'$push':{'commits':commitid}})
		
		responseobj= {'commitid':str(commitid),'userid':str(commits['user']['id'])}

		#response.put(responseobj)
		r.publish('cy-pullcommits', json.dumps(responseobj))
		
		print commits




if __name__=='__main__':
	Main()