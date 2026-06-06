---
title: Building My Own Operating System Day 0
description: My journey on learning and building my own operating system. Blog on unix system file system module and process management system module introduction.
author: Buffbahun
published: 2026-06-01
updated: 2026-06-01
tags:
  - algorithms
  - system desing
  - kernel
  - c
  - operating system
slug: BMOOSD_0
---

# Building My Own Operating System

## Day 0

Started building my own operating system in Rust, day 0. I am starting my journey first by getting deep and intuitive knowledge in system design and filling my gaps in architecture and Unix systems along the way. I have started studying the system design of the System V kernel. Pretty old, I know, but the core philosophy and its simplicity will be very helpful for better understanding and getting an intuition of this world. For this specific purpose, I have started a deep dive into "The Design of the Unix Operating System" by Bach. I am in my initial stage, but already this book's vibe is greatly matching with my learning style. It has no nonsense bullshit side-quest kind of thing and tries to go deep on the main topic. A lot of data structures, logical graphs, and algorithms. C'mon, I love algorithms. Today, with my study, I got some surface knowledge on the two most important modules of the Unix system: the file system module and the process management module.

The file system module helps create an illusion for the user that the disk/primary storage is a hierarchical and managed bookkeeping of all the data in files and directories. For this illusion to be constructed, the file system heavily relies on the following data structures: User File Descriptor Table, File Table, and Inode Table. Let's first inspect the Inode Table. The Unix kernel identifies a file/directory using an inode number and its underlying structure. Inode, short for Index Node, is an index/pointer to the list of actual raw data on the disk along with other info like how large the file is and where to find other indexes/pointers for the blocks in the storage that constitute the file.

Let's now look at the User File Descriptor Table. It's a data structure that contains entries/indexes for all the open files in a specific process. When we call the open and creat system calls, the kernel returns file descriptors for these system calls that are indexed in the User File Descriptor Table. Now, when calling the read and write system calls from that process, the kernel uses these file descriptors to access the index in the User File Descriptor Table, which gives a pointer to the File Table and which ultimately gives the inode from the Inode Table of the file that we intended to use in the process.

Now let's look at the File Table. It's basically a global kernel data structure that helps in sharing access to a file between processes. We will surely explore more on this and other data structures of the file system in the later series when we deep dive into the file system module.

The file system data structures, especially the inode list, need to be stored somewhere in the primary storage. So let's look at how these logical structures are mapped onto the actual disk. From the point of view of the kernel, a system may have one or multiple physical disks, but on the logical side, multiple disks can be treated as one logical disk or, in another case, one disk can be divided into multiple logical disks as the administrator/user intends.

A physical disk with a file system has a layout as follows:

```text
   |------------|-------------|---=======--|---=======--|
   | boot block | super block | inode list | data block |
   |------------|-------------|---=======--|---=======--|
```
  
The boot block contains code/data that is necessary to bootstrap the system when we power on the system. At least one of the file systems on the system contains the actual code; others may have dummy data or be empty with the required space allocated. It usually is present at the beginning of the disk. The super block contains information about the file system, such as how large the file system is, how many files it is capable of storing, where to find free spaces on the disk's file system, etc. The super block is followed by the inode list table, which has entries of the inode data structure that contains pointers to the actual data blocks for the specific file the inode is referring to. It also contains the owner/group information and the permissions of the file and other stuff that we will look at in detail when we deep dive into this topic. The inode list is followed by the data block section, which is the actual raw data of a specific file. The data block section is logically divided into predefined chunks of bytes so that access to data in a file and accessing a file is homogeneous, e.g., 512 bytes, 1 KB.

Uff, we have covered a lot for today. Though it's a surface-level introduction to the modules and their submodules, it will help us navigate further and understand better when we have a closer look at these topics. So have a nice day. Hope you find this information useful. One thing I will emphasize is that I am not an expert in any of these fields. I am learning from scratch, and there will be many mistakes, I admit. So I am taking this as documentation of my learning journey. Thank you.

[Next Article](/blogs/BMOOSD_1_2/)