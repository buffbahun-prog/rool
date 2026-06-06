---
title: Building My Own Operating System Day 1 and 2
description: My journey on learning and building my own operating system. Blog on buffer cache, double linked list and hash queue.
author: Buffbahun
published: 2026-06-02
updated: 2026-06-02
tags:
  - algorithms
  - system desing
  - kernel
  - c
  - operating system
  - buffer cache
  - double linked list
  - hash queue
slug: BMOOSD_1_2
---


# Building My Own Operating System

## Day 1 and 2
Today was an eye-opening day for me. I learned what a Buffer Cache is. Imagine you want to read/modify a file. The usual process is that the system loads the file blocks from the specific file system in the storage to the main memory. Then you read or apply the changes. Now, on file modification, it needs to write the changes back to the storage. Storage I/O is slow in comparison to the main memory. The latency for I/O operations in storage makes a huge difference and adds up when, instead of one or a few files, we are operating on multiple hundreds of files. The solution for this specific limitation is implemented in the Unix system as Buffer Cache. Buffer Cache is just some memory allocated in the main memory for caching/holding the data of a certain file for a certain amount of time. The primary algorithm used with the Buffer Cache to make it efficient is the Least Recently Used (LRU) algorithm.

As the name implies, the algorithm favors the oldest cache that will not be used and replaces it with new block data. The main data structure that we need to understand to properly implement this algorithm is the Doubly Linked List. Before this, first we understand what a Linked List is. It's just a chain of data that is also pointing to the next adjacent data in the chain.

```text
   [a] -> [b] -> [c] ->

```
Now a Doubly Linked List is almost the same as a Linked List but with an additional pointer to the previous adjacent data in the chain.

```text
   [a] <-> [b] <-> [c] <->

```
So whats the usefulness of this data structure in compared to the simple linked list? With this structure its very esy to add and remove elemnts form any position in the chain. Suppose there is a chain of [a] to [c]. Now we want to insert [b] between [a] and [c]. Now if we only have access to one of the element either [a] or [c] we can insert [b]:
So what's the usefulness of this data structure compared to the simple Linked List? With this structure, it's very easy to add and remove elements from any position in the chain. Suppose there is a chain from [a] to [c]. Now we want to insert [b] between [a] and [c]. Now if we only have access to one of the elements, either [a] or [c], we can insert [b]:

1. Change [a]'s next pointer from [c] to [b].
2. Change [c]'s previous pointer from [a] to [b] (we can get the [c] element easily as [a] previously had its next pointer to [c]).
3. Change [b]'s previous pointer to [a] and its next pointer to [c].

```text
              .-----.
              |     |      
    NULL <--- |  b  | ---> NULL
              |_____|

       .-----.        .-----.
       |     | -----> |     |
 <---  |  a  | <----- |  c  | ----->
       |_____|        |_____|


```

```text
              .-----.
              |     |      
            / |  b  | \
           /  |_____|  \
           v    A  A    v
       .-----. /   \  .-----.
       |     |/     \ |     |
 <---  |  a  |       \|  c  | ----->
       |_____|        |_____|


```

Its real usefulness comes when we want to remove an element from the chain. For removing an element, we need to have two pointers to its neighbors (previous and next element) so that when removing the element we can join the previous and next elements so that it stays a chain. With just a Linked List, we would have the next element pointer, but to get the previous pointer we would have to loop across the chain to find the previous element. But with a Doubly Linked List, we already have pointers to both of its adjacent previous/next elements.

Hash Queue is another important data structure we will be implementing, so it's rudimentary to understand it now. It's just a list of Doubly Linked Lists which is sequential and indexed from 0 to (hash - 1). Why do we need this? I think an example will help us here. Suppose we have 1000 buffers and all are linked in a chain with one big Doubly Linked List. Now we want the buffer with block number 500. To get it with our list, we loop across the chain, check the block number of the buffer, if it matches return it, else continue the loop by checking the next pointer of the buffer. This is not quite efficient.

We can make this efficient with a mathematical trick and an additional list. Say we now have a sequential list up to index n. The elements of the list are pointers to the start/head of a Doubly Linked List. We now put each buffer with block number x at the tail of the list at index:

index = x % n

The modulo operator gives the remainder of the operands and always gives a number between (0 to n - 1).

Now suppose we have a total of 5 headers in the sequential list. To find the buffer with block number 500 we can do:

500 % 5 = 0

which results in 0, which is the index where we are sure the buffer must be. As you can see, it reduced the loop operation significantly. Nice, right?

Ok, I think my head is heavy with today's session. With this data structure understanding on our side, I will implement these data structures and also their basic operations (insert/remove) in the next session.

Thank you. Until next time.