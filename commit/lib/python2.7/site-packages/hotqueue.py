# -*- coding: utf-8 -*-

"""HotQueue is a Python library that allows you to use Redis as a message queue
within your Python programs.
"""

from functools import wraps
try:
    import cPickle as pickle
except ImportError:
    import pickle

from redis import Redis


__all__ = ['HotQueue']

__version__ = '0.2.7'


def key_for_name(name):
    """Return the key name used to store the given queue name in Redis."""
    return 'hotqueue:%s' % name


class HotQueue(object):
    
    """Simple FIFO message queue stored in a Redis list. Example:

    >>> from hotqueue import HotQueue
    >>> queue = HotQueue("myqueue", host="localhost", port=6379, db=0)
    
    :param name: name of the queue
    :param serializer: the class or module to serialize msgs with, must have
        methods or functions named ``dumps`` and ``loads``,
        `pickle <http://docs.python.org/library/pickle.html>`_ is the default,
        use ``None`` to store messages in plain text (suitable for strings,
        integers, etc)
    :param kwargs: additional kwargs to pass to :class:`Redis`, most commonly
        :attr:`host`, :attr:`port`, :attr:`db`
    """
    
    def __init__(self, name, serializer=pickle, **kwargs):
        self.name = name
        self.serializer = serializer
        self.__redis = Redis(**kwargs)
    
    def __len__(self):
        return self.__redis.llen(self.key)
    
    @property
    def key(self):
        """Return the key name used to store this queue in Redis."""
        return key_for_name(self.name)
    
    def clear(self):
        """Clear the queue of all messages, deleting the Redis key."""
        self.__redis.delete(self.key)
    
    def consume(self, **kwargs):
        """Return a generator that yields whenever a message is waiting in the
        queue. Will block otherwise. Example:
        
        >>> for msg in queue.consume(timeout=1):
        ...     print msg
        my message
        another message
        
        :param kwargs: any arguments that :meth:`~hotqueue.HotQueue.get` can
            accept (:attr:`block` will default to ``True`` if not given)
        """
        kwargs.setdefault('block', True)
        try:
            while True:
                msg = self.get(**kwargs)
                if msg is None:
                    break
                yield msg
        except KeyboardInterrupt:
            print; return
    
    def get(self, block=False, timeout=None):
        """Return a message from the queue. Example:
    
        >>> queue.get()
        'my message'
        >>> queue.get()
        'another message'
        
        :param block: whether or not to wait until a msg is available in
            the queue before returning; ``False`` by default
        :param timeout: when using :attr:`block`, if no msg is available
            for :attr:`timeout` in seconds, give up and return ``None``
        """
        if block:
            if timeout is None:
                timeout = 0
            msg = self.__redis.blpop(self.key, timeout=timeout)
            if msg is not None:
                msg = msg[1]
        else:
            msg = self.__redis.lpop(self.key)
        if msg is not None and self.serializer is not None:
            msg = self.serializer.loads(msg)
        return msg
    
    def put(self, *msgs):
        """Put one or more messages onto the queue. Example:
        
        >>> queue.put("my message")
        >>> queue.put("another message")
        
        To put messages onto the queue in bulk, which can be significantly
        faster if you have a large number of messages:
        
        >>> queue.put("my message", "another message", "third message")
        """
        if self.serializer is not None:
            msgs = map(self.serializer.dumps, msgs)
        self.__redis.rpush(self.key, *msgs)
    
    def worker(self, *args, **kwargs):
        """Decorator for using a function as a queue worker. Example:
        
        >>> @queue.worker(timeout=1)
        ... def printer(msg):
        ...     print msg
        >>> printer()
        my message
        another message
        
        You can also use it without passing any keyword arguments:
        
        >>> @queue.worker
        ... def printer(msg):
        ...     print msg
        >>> printer()
        my message
        another message
        
        :param kwargs: any arguments that :meth:`~hotqueue.HotQueue.get` can
            accept (:attr:`block` will default to ``True`` if not given)
        """
        def decorator(worker):
            @wraps(worker)
            def wrapper(*args):
                for msg in self.consume(**kwargs):
                    worker(*args + (msg,))
            return wrapper
        if args:
            return decorator(*args)
        return decorator

