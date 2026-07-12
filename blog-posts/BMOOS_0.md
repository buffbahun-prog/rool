---
title: Building My Own Operating System Day 0
description: My journey on learning and building my own operating system. Blog on unix system file system module and process management system module introduction.
author: Buffbahun
published: 2026-07-11
updated: 2026-07-11
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

This is a series of mine documenting my time building an actual, usable operating system. Sounds crazy, right? Yes. At first, I was feeling overwhelmed and didn't know how to start or even where to start from. In my head, it actually feels impossible right now that one day I will build an actual OS from scratch. But we have to at least take the first step towards the goal.

I don't remember where I heard it, but the saying goes, "If a goal scares you even thinking about it, that's the thing you should be doing." I think I heard it from a random reel. 😆

Okay, enough of that. Let me tell you about my initial plans, which I have already started.

I have started reading a book titled "The Design of the UNIX Operating System" by Maurice J. Bach. It's a very old book, probably published during the early days of UNIX. But there are a few things that stand out for my use case.

First of all, because it is old and describes the internals of UNIX System V, which was one of the early versions of UNIX, the overall system is much simpler. That makes it easier for me to get started and understand the concepts over time.

The other thing I like about this book is that it contains many diagrams, algorithm explanations in pseudocode, and detailed descriptions. I really like this style of teaching. I also like the author's way of doing a deep dive into each topic. It is very helpful for me since I am ultimately trying to build an OS, even if it's just a toy one.

Today I finished reading the preface and the first chapter.

Already, I have learned some new things. I had no idea about the execution levels at the hardware level. There are at least two execution levels: user mode and kernel mode.

When a user program is running, it executes in user mode. When the program encounters or makes a system call, the execution switches to kernel mode. Now the kernel can execute the requested operation, whether it's disk I/O, a network request, or something else. After completing the request, execution switches back to user mode.

Not only do system calls switch execution from user mode to kernel mode, but interrupts and exceptions do as well, such as clock interrupts, disk interrupts, and software interrupts.

The other fascinating thing that I learned today, which I found very important, is the philosophy behind building the UNIX system.

The idea is to build small, primitive programs that do only one job, but do it really well, and then encourage building more complex programs by combining these primitives together.

It is something I have encountered while using Linux and programming over all these years, but I had never really thought about it from this perspective. This is one of the reasons C is still in use and UNIX/Linux are so widely used and loved by people.

Following this philosophy, the UNIX kernel only contains the functionality that is absolutely required by the system. Everything else is the responsibility of user space, where applications are built using the primitives and services provided by the kernel.

This allows people to modify existing programs or build their own versions according to their needs. For example, the shell exists entirely in user space, allowing anyone to create or modify their own shell implementation.

This chapter also lightly introduced the file system module of the kernel.

It is a hierarchical file system with its origin at the root, denoted by the '/' character. To locate a file, we traverse from the root to that specific file in the directory tree. This sequence is called the path of the file.

Another fascinating concept is the UNIX philosophy that everything is treated as a file, including devices, peripherals, and terminal devices.

This abstraction allows user-space programs to interact with hardware without knowing anything about the underlying drivers or hardware implementation. Programs can access devices almost the same way they access regular files in the file system.

Now we have a basic understanding that the kernel does most of the heavy lifting. It creates and manages the file system, manages processes, manages main memory, and protects the file system and files using various mechanisms that we will explore throughout this series.

In simple terms, the UNIX kernel provides a simple and consistent execution environment for our programs. It allows multiple programs to coexist on the system while also providing an intuitive and consistent way to manage our data through the file system.

Starting with the core philosophy and a general overview of the UNIX system is enough for today because I have already learned many new things.

I will continue this series by documenting my journey every day as I learn, understand, and implement my own operating system from scratch. Slowly and gradually, we will move towards that goal—at least, that's the plan.

One more thing: I am in no way an expert in this field. I am simply a curious individual trying to learn as much as possible, and this is my first time documenting anything. I think you can probably tell that from my writing too. But I hope to improve with consistency and effort.

If you have any feedback that could help me improve, please send me an email. I am always open to positive and constructive feedback.

Okay, see you next time.

Have a good one.

Cheers.

[Next Article](/blogs/BMOOSD_1/)