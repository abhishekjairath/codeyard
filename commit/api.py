import os
from pymongo import MongoClient 
from hotqueue import HotQueue
import json

def func(name,path):
	d={}
	addedfinal=[]
	deletedfinal=[]
	delete_add_then=[]
	delete_add_now=[]
	if path != "null":
		file1=open(path,'r')
		file2=open("//home/aman/Desktop/Work/hello/temp/"+name,'r')
		read1=file1.readlines()
		read2=file2.readlines()
		file1dec1={}
		file1dec2={}
		file2dec1={}
		file2dec2={}
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
				b={'then':check_name,'now':added[m],'line_no':lineno}
				add_deletedlast.append(b)
				delete_add_then.append(check_name)
				delete_add_now.append(added[m])
			m=m+1
		addedfinal=list(set(added)-set(delete_add_now))
		deletedfinal=list(set(deleted)-set(delete_add_then))
	else:
		o=open("//home/aman/Desktop/Work/hello/temp/"+name,'r')
		addedfinal=o.readlines()


	addedfinallast=[]
	deletedfinallast=[]
	
	
	if  len(addedfinal)>0:
		for item in addedfinal:
			b={}
			b={'then':'null','now':item,'line_no':file2dec1[item]}
			addedfinallast.append(b)
	
	if len(deletedfinal)>0:
		for item in deletedfinal:
			b={}
			b={'then':item,'now':'null','line_no':file1dec1[item]}
			deletedfinallast.append(b)



	d['file_name']=name
	d['file_size']=str(os.path.getsize("//home/aman/Desktop/Work/hello/temp/"+name)/float(1000))+"Kb"
	d['addlines']=addedfinallast
	d['deletelines']=deletedfinallast
	d['add_delete']=add_deletedlast

	return d




#a='{"file":[{"name":"tes1.c","path":"/home/aman/Desktop/Work/hello/tes1.c"}],"commit_head":"new commit","commit_desp":"abcd","time":"12 sep","repoid":"1","userid":"2"}'


	

def Main():
	
	client=MongoClient('127.0.0.1',27017)              # mongo connection
	db=client['new']
	
	q=HotQueue("Q",serializer=json)                    #redis queue listener implementation using Hotqueue and usind json serializer
	
	for a in q.consume():
		files=[]
		
		for item in a['file']:
			files.append(func(item['name'],item['path']))

		commits={
					'commit':files,
					'commit_description':a['commit_desp'],
					'commit_heading':a['commit_head'],
					'time_created':a['time'],
					'comment':[],
					'repo_id':a['repoid'],
					'user_id':a['userid']
				}
		
		commitid = db.commit.insert(commits)
		
		db.repo.update({'_id':commits['repo_id']},{'$push':{'commit_id':commitid}})
		
		db.user.update({'_id':commits['user_id']},{'$push':{'commit_id':commitid}})
		
		print commits

if __name__=='__main__':
	Main()

