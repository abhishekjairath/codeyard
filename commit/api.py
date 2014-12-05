#!/usr/bin/python
import os
from pymongo import MongoClient 
from hotqueue import HotQueue
import json
import datetime
from bson.objectid import ObjectId
import collections
import difflib
import redis

def get_file_size(filename):
	return os.path.getsize(filename)
	
def file_readlines(filename):
	f=open(filename,'r')
	readlines=f.readlines()
	f.close()
	return readlines

def file_read(filename):
	f=open(filename,'r')
	read=f.read()
	f.close()
	return read

def file_write(filename,text):
	f=open(filename,'w')
	f.write(text)
	f.close()

def delete_file(filename):
	os.remove(filename)

def rename_file(oldname,newname):
	os.rename(oldname,newname)

def replace_file(oldfile,newfile):
	text=file_read(newfile)
	file_write(oldfile,text)
	delete_file(newfile)

#function to return dictionary containing updated line details 
def update_line(stat,c_then,c_now,l_then,l_now):
	update = {

				'status': stat,
				'content_then':c_then,
				'content_now':c_now,
				'line_then':l_then,
				'line_now':l_now
				}
	return update

def calculate_changes(read1,read2):
	change = difflib.ndiff(read1,read2)										#store changes in old and newfile
	updations = []
	changes = []														#list to read changes
	for line in change:
		changes.append(line)
	l=i=j=0
	#loop through list of lines updated to store details in updation list
	while l<len(changes):
		#for added line
		if changes[l][0]=='+':
			i+=1
			updations.append(update_line(0,None,changes[l][2:],None,i))
		elif changes[l][0]=='-':
			#for deleted line
			if l+2<len(changes):
				# add delete line with some changes added
				if changes[l+2][0]=='?':
					i+=1
					j+=1
					updations.append(update_line(2,changes[l][2:],changes[l+1][2:],j,i))
					l=l+2
				#add delete line with some changes deleted
				elif changes[l+1][0]=='?':
					i+=1
					j+=1
					updations.append(update_line(2,changes[l][2:],changes[l+2][2:],j,i))
					l+=2
				# deleted lines
				else:
					j+=1
					updations.append(update_line(1,changes[l][2:],None,j,None))
			# deleted line	
			else:
				j+=1
				updations.append(update_line(1,changes[l][2:],None,j,None))
		else:
			i+=1
			j+=1	
		
		l+=1
	return updations		



#function to calculate diff for files passed 
def diff_file(name,path,isnew,tag,db,repoid,file_dir):
	path+="/"
	oldfile = file_dir+path+name
	newfile = file_dir+path+"temp_"+name
	file_commit = {} 															# dictionary to store filename and updations done in single file
	updations = []																# list of updations in a file
	#for changes done in old file
	if isnew == "false":								
		read1 = file_readlines(oldfile)
		read2 = file_readlines(newfile)
		updations = calculate_changes(read1,read2) 
		replace_file(oldfile,newfile)												#replace content of old file with newfile  
		filesize = get_file_size(oldfile)
		db.repos.update({'_id':ObjectId(repoid),'files.path':path+name},\
						{'$set':{'files.$.size':filesize,'updated':datetime.datetime.utcnow()}})
	# adding new file 
	else:
		newfile_read = file_readlines(newfile)
		rename_file(newfile,oldfile )	
		i=0
		while i<len(newfile_read):
			updations.append(update_line(0,None,newfile_read[i],None,i+1))
			i+=1
		filesize = get_file_size(oldfile)
		fileupdate = {'path':path+name,'tag':tag,'name':name,'size':filesize,'slug':None,'_id':ObjectId()}
		db.repos.update({'_id':ObjectId(repoid)},{'$push':{'files':fileupdate},\
												  '$set':{'updated':datetime.datetime.utcnow()}})

	file_commit['file']=name
	file_commit['updations']=updations
	return file_commit




#a = '{"file":[{"isnew":"true","name":"tes4.c","path":"Realtime","extension":"c"}],"desc":"abcd","repoid":"54548e99cf45ddfac9d2579a","reposlug":"Realtime","userid":"546dd1f46e8610418688fd26","username":"aman"}'


	


def Main():

	config = file_read('config.json')
	config = json.loads(config)
	HOST = config['mongohost']
	PORT = config['port']
	DB_NAME = config['database_name']
	LISTENER_QUEUE = config['listener_queue']
	RESPONSE_QUEUE = config['response_queue']

	file_dir = config['repo_directory']
	client = MongoClient(HOST,PORT)
	
	db = client[DB_NAME]
	
	listen = HotQueue(LISTENER_QUEUE,serializer=json)

	response = HotQueue(RESPONSE_QUEUE,serializer=json)

	r = redis.StrictRedis(host='localhost', port=6379, db=0)

	print "\nPython-Redis-Listener-Started "

	for item in listen.consume():
		
		files = []
		for _file  in item['files']:
			files.append(diff_file(_file['name'],_file['path'],_file['isnew'],_file['tag'],db,item['repoid'],file_dir))
		
		commits = {
					'changes'  : files,
					'desc'     : item['desc'],
					'created'  : datetime.datetime.utcnow(),
					#'comment'  : [],
					'repo'     : {'id':ObjectId(item['repoid']),'slug':item['reposlug']},
					'user'     : {'id':ObjectId(item['userid']),'username':item['username']}
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