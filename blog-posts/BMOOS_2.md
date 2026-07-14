---
title: Building My Own Operating System Day 0
description: My journey on learning and building my own operating system. Blog on buffer cache, double linked list, hash queues.
author: Buffbahun
published: 2026-07-13
updated: 2026-07-13
tags:
  - algorithms
  - system design
  - kernel
  - c
  - operating system
slug: BMOOSD_2
---

# Building My Own Operating System

## Day 2
Today lets straight jump in the code and I will explain it in details.

First lets implement data structure for our buffer cache.

```c
typedef enum {
  FALSE = 0,
  TRUE = 1,
} Bool;

typedef struct BufferStatus {
  Bool isLocked;
  Bool isValid;
  Bool delayedWrite;
  Bool isReadingWriting;
  Bool isWaiting;
} BufferStatus;

typedef struct Buffer {
  uint16_t devNum;
  uint64_t blkNum;
  BufferStatus status;
  uint8_t *data;
  struct Buffer *hashQueueNextBuf;
  struct Buffer *hashQueuePrevBuf;
  struct Buffer *freeListNextBuf;
  struct Buffer *freeListPrevBuf;
} Buffer;
```
On the top I have implemented a boolean enum type so its an easier conventions for us.

Now lets look into the BufferStatus structure. The first status or say flag is the isLocked flag. With this flag no two process at a time can access the buffer block at the same time. Without this flag two processes A and B could get access of this buffer containing the block data and modify the data and in the time of writing back to disk, the kernel can't be sure which of this data is the correct one. This is also the reason only a single buffer can have its have access of the block in that particular file system.

The isValid flag specifies whether the data in the buffer is valid or not and with this flag the kernel can decide whether to read/write the data to the disk.

The delayedWrite flag indicates whether the buffer is modified and ready to be written back to disk. One thing to understand here is the buffer cache mechanism favours additional modification of the data before writing to the disk as it reduces latency while constantly writing to the disk and writes it when its actually necessary.

The isReadingWriting flag indicates whether at this moment disk I/O is going on the buffer. The disk I/O is asynchronous in nature we cant exactly know when will it complete thus the buffer ready to be used.

The isWriting flag indicates whether one or more processes are asleep on the event that the buffer will be free. With this flag all the asleep processes can wake up when the buffer becomes free.

Lets us now have a look in our Buffer structure. The two fields devNum and blkNum are the logical device number and block number respectively for which the buffer has the data of. The status field he have just discussed above.

The data field is a pointer to the actual copied data of the block somewhere in the data pool of the buffer.

Now the last four pointer fields are quite interesting. To get this right we should first investigate what list, linked list and double linked list are. My first encounter with this topic was quite scared, but not to worry buffbahun is here. I will try explaining it clearly and despite their name they are quite simple.

Lets start with the humble List. List is simply a liner contiguous series of data locating besides each other in the memory. We can use indexes starting from 0 for the start element and can get to next element with the step increment to the index by 1 and so on till we get to the last of the element in the list which is one less then the total list size. Now with this data structure we can easily access any element in the list by simply providing the right index number. Its also easy to add a element to the end/tail of it by simply copying data on the index which equal to the total size of the list because the index starts from 0. and update the total size one more then the previous one that is total_size + 1. And similarly we can remove an element from the last index by just updating the total size of the index to one less then the previous one total_size - 1. Easy right?

Now the difficulty arises when we try to add/remove elements from the middle of the list. For this to work we will need to update the total_size value but also the index of every elements after the one in the middle which we re operating in. In the case for adding a element we need to copy the data of the next element to a temporary variable and update that index element to that of we are tying to put and loop it till the last element in the same manner and update the total_size number. Similarly for removing an element from middle the same thing in reverse with looping till the last element. This adds up the time quickly with large lists.

As we see adding/removing elements except from the last comes with its perks in the list data structure, we need a better data structure that makes this process less time consuming that thats what the linked list does much better. Instead a list being a contagious memory with neighboring elements, the linked list data structure need not be next to each other but can be located anywhere in the memory but for them to create a chain of elements in addition to the data the element also contains the pointer to the next element of the list. Starting from the first element which contains the pointer to its next element, the next element to its next element and so on to the last element, the last elements pointer could point to null to indicate its tail/end or could point it to a header to make it circular.

Now adding and removing an element is simple enough that we don't need to update all the next elements indexes, we just update the pointers of the elements sitting besides it(previous and next element), pointing the previous elements pointer to the next element after the removed element in case we remove it and for a added element we update the previous elements pointer to the newly added element and the newly added elements pointer to that of its next one.

But if you notice its easy to get the next element as every element has a pointer to its next element it, but to get the previous element we should loop from the start till we get the element. And for operations such as adding and removing we need both the previous and next element. But what if there is a data structure that has pointers to both its previous and next element? Yes there is where double linked list enters the picture.

Its very similar to linked list but with an addition pointer to the previous element as well. Now adding and removing the elements from anywhere in the list is very straightforward. We don't need to loop around to get any neighboring elements as the element has both the previous and next elements pointer, now we just have to update the pointers o point at the correct element according to our addition and remove operation.

With this data structure lets understand what these two pairs of pointers in our Buffer structure are. The two pairs of pointers are for free list and hash queue. As we already know what a double linked list is now you get the idea why they are in pair for its previous and next pointers. Free List is a data structure that contains the buffers that are free and not in use at this moment. Initially when the system starts up all the buffers are in this free list as until now no buffers are in use by any process. Eventually when a process needs a buffer it looks on the free list and gets the required buffer and removes it from the free list(as the data structure is double linked list its very easy t remove the buffer) and sets its isLocked flag to true. Now no other process can use it as it is locked and after a while when the process releases the buffer it is put back on the free list particularly to its tail and sets the isLocked flag to false so other process sleeping on the event it becomes free can use it.

Lets now explore the hash queue. I think you where wondering after an buffer is removed from the free list what happens to it? It is added to the hash queue. Hash queue is another data structure for the buffer, where it is a list of double linked list. I know head is scratching right now. I will tell you the full picture.

Remember at the system startup all the buffers are in the free list and it doesn't contain any valid data and no valid block and device number. But when an invalid buffer with garbage data is taken out of free list it updates the actual block and device number and copies the data of the actual block in disk to its data field. Then its put on the hash queue, so we are sure if its on the hash queue it has valid data and block/device number of that particular block. So when the kernel searches for a block buffer it first searches in the hash queue. If it finds it it might be free or locked. If its free then the process locks it, removes it from the free list and use it, if its locked then it sleeps until it is free. And if doesn't find a block buffer in the hash queue, in then takes any buffer in the free list and always the one in the start as this mechanism favours the recently used buffer and incentives to use to the oldest used buffer and updates it device/block number and copies the actual block data from the disk and put it on the correct position in the hash queue.

Now another question arises, but why doe we need to make this data structure of hash queue more complicated? Cant we just make it a double linked list exactly as the free list? Yes we could absolutely do it. But, and its a claver but, we remember that hash queue has the valid data of the required block if its on the queue it might e locked or free we don't care. But on the free list we just take the first buffer if we need one and add to its tail when we don't need it. So the actual search is going on the hash queue. There might be thousands to buffers in the hash queue and as we search for a buffer of a particular block from the beginning of the list it is quite inefficient.

Now picture a scenario, I have a block of block number 'b', Now i create a simple list of 'N' total size. And each element of the list is a double linked list. Now while adding the buffer with block number 'b' first I do modulo operation such as (b % N) and as this operation always gives value between 0 to N-1 which is the allowed indexes in the list and put the buffer in that index (index = b % N). Now watch what will happen when I need a buffer with block number 'b'. Instead of searching the whole double linked list from the start till i get the buffer, I can do (index = b % N) and that the index where the block should be, this way we have made the loop smaller and get the required buffer in short time.

If we don't find the buffer on that index of the hash queue we are sure that its not on the hash queue so we could take the first buffer in the freelist, update its block/device number, copy the correct block data from the disk, remove it from the free list, set its isLocked to true and calculating the index with (index = b % N) put it on the the tail of the the double linked list on that particular index of the hash queue.

I think we have learned a thing or two about the different data structure, especially the double linked list and its pros to our use-case, and we have used this data structure to apply for the free list and hash queue for our buffer. Its enough for today. On the next day we will be implementing this data structure to our algorithms to make a proper buffer cache.
Till then,
Have a good one,
Cheers.

Om nama shivaya