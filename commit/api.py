import os
from pymongo import MongoClient 
from hotqueue import HotQueue
import json
import datetime
from bson.objectid import ObjectId

def replace(oldfile,newfile):
	f=open(oldfile,'w')
	g=open(newfile,'r')
	text=g.read()
	f.write(text)
	f.close()
	g.close()
	os.remove(newfile)

def func(name,path,isnew,extension,db,repoid):
	file_dir="//home/abhishek/Documents/repos/"
	d={}
	path=path+"/"
	addedfinal=[]
	deletedfinal=[]
	delete_add_then=[]
	delete_add_now=[]
	file1dec1={}
	file1dec2={}
	file2dec1={}
	file2dec2={}
	updations=[]
	if isnew == "False":
		file1=open(file_dir+path+name,'r')
		file2=open(file_dir+path+"temp_"+name,'r')
		read1=file1.readlines()
		read2=file2.readlines()
		i=j=0
		k=1
		while i<len(read1):
		#read1[i]=read1[i].strip()
			file1dec1[read1[i]]=k
			file1dec2[k]=read1[i]
			k=k+1
			i=i+1
		k=1
		while j<len(read2):
			#read2[j]=read2[j].strip()
			file2dec1[read2[j]]=k
			file2dec2[k]=read2[j]
			k=k+1
			j=j+1
		add_deletedlast=[]
		added=list(set(read2)-set(read1))
		deleted=list(set(read1)-set(read2))
		m=0
		delete_add_then=[]
		delete_add_now=[]
		while m<len(added):
			lineno=file2dec1[added[m]]
			check_name=file1dec2[lineno]
			if(check_name in deleted):
				b={}
				b={'content_then':check_name,'content_now':added[m],'line':lineno,'status':2}
				updations.append(b)
				delete_add_then.append(check_name)
				delete_add_now.append(added[m])
			m=m+1
		addedfinal=list(set(added)-set(delete_add_now))
		deletedfinal=list(set(deleted)-set(delete_add_then))

		replace(file_dir+path+name,file_dir+path+"temp_"+name)
		filesize=os.path.getsize(file_dir+path+name)
		db.repos.update({'_id':ObjectId(repoid),'files.path':path+name},{'$set':{'files.$.size':filesize}})


	else:
		o=open(file_dir+path+"temp_"+name,'r')
		addedfinal=o.readlines()
		os.rename(file_dir+path+"temp_"+name,file_dir+path+name)	
		i=0
		k=1
		while i<len(addedfinal):
		#read1[i]=read1[i].strip()
			file2dec1[addedfinal[i]]=k
			k=k+1
			i=i+1
		filesize = os.path.getsize(file_dir+path+name)
		fileupdate={'path':path+name,'tag':extension,'name':name,'size':filesize,'slug':None,'_id':ObjectId()}
		db.repos.update({'_id':ObjectId(repoid)},{'$push':{'files':fileupdate}})

	
	if  len(addedfinal)>0:
		for item in addedfinal:
			b={}
			b={'content_then':'null','content_now':item,'line':file2dec1[item],'status':0}
			updations.append(b)
	
	if len(deletedfinal)>0:
		for item in deletedfinal:
			b={}
			b={'content_then':item,'content_now':'null','line':file1dec1[item],'status':1}
			updations.append(b)
	
	d['file']=name
	d['updations']=updations
	
	
	return d




#a = '{"file":[{"isnew":"False","name":"tes4.c","path":"Realtime/","extension":"c"}],"desc":"abcd","repoid":"54524083725c58f9d20eb77a","reposlug":"Realtime","userid":"54524059725c58f9d20eb779","username":"aman"}'


	

def Main():

	client = MongoClient('127.0.0.1',27017)
	
	db = client['mean-dev1']
	
	listen = HotQueue("cpush",serializer=json)

	response = HotQueue("cpull",serializer=json)

	
	for a in listen.consume():
		files = []

		for item in a['files']:
			files.append(func(item['name'],item['path'],item['isnew'],item['extension'],db,a['repoid']))
		
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

		response.put(responseobj)
		
		print commits

if __name__=='__main__':
	Main()