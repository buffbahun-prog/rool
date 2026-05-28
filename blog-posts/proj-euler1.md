---
title: Project Euler Problem 1
description: Mathematical analysis and optimized solution for Project Euler Problem 1 in C.
author: Buffbahun
published: 2026-05-28
updated: 2026-05-30
tags:
  - algorithms
  - mathematics
  - project-euler
  - c
slug: project-euler-problem-1
---

# Project Euler

## Problem 1
If we list all the natural numbers below 10 that are multiples of 3 or 5, we get 3, 5, 6 and 9. The sum of these multiples is 23.

Find the sum of all the multiples of 3 or 5 below 1000.

[Problem 1 link](https://projecteuler.net/problem=1)

If we look closly on the sum of multiples of either of the numbers, we can common out the multiplier(in this case 3 or 5) and the remaining multiplicand are the sum of natural numbers.

$3+6+9+12+... = 3(1+2+3+4+...)$

We have formula of sum of natural numbers as:

$$
\sum_{k=1}^{n} k = \frac{n(n+1)}{2}
$$

this i have implement in my program as:

```c
int sumToN(int nth) {
    if (nth <= 0) return -1;
    return (nth * (nth + 1)) / 2;
}
```

So the thing we need to figure out is the $n^{th}$ upto which web have to sum. From the problem as stated sum of multiples below 1000, if we divide $(1000-1)$(which is technically below 1000) by the multiplier(3 or 5) we get the quotent as the $n^{th}$ term. Now getting this $n^{th}$ term we can get the sum of natural numbers by my above function and have it multiply with the muplipliers(3 and 5) respectively and a final sum should give us the solution. But a detail is missing that is not clearly shown in the example in the problem. We havent taken any account for the common multiples of 3 and 5 thatre added twice.For example 15 is the product of 3 and 5 and this multiple 15 is added twice. And from the statements of the problem we are not suppose of add twice any multiples.So the only way now is to substract the common multiples once so that we are left with just a single common multiple that is summed.

We can closly observe this these common multiples as:

$$
3,6,9,12,{\color{red}15},18,21,24,27,{\color{yellow}30},33
$$

$$
5,10,{\color{red}15},20,25,{\color{yellow}30},35
$$

$$
15 = 3 \times 5 | 5 \times 3
$$

$$
30 = 3 \times 5 \times 2 | 5 \times 3 \times 2 | 15 \times 2
$$

from the above analysis we can see that the lowest common multiple(in this case 15) and its multiples upto $n^{th}$ term(the same method as for the two numbers above for $n^{th}$ term). Now how do we properly calculate the LCM(short for Lowest Common Multiple) between any two natural numbers? From further analysis we have found that LCM is the product of these two numbers divided by the HCF(Highest Common Factor) of these two numbers.

$$
LCM = \frac{num1 \times num2}{HCF(num1, num2)}
$$

In my code I have implement it as:

```c
int lcm(int num1, int num2) {
    if (num1 <= 0 || num2 <= 0)
        return -1;
        
    return (num1 * num2) / hcf(num1, num2);
}
```

Now to calculate the HCF between two natural numbers we could loop the two numbers starting from 1 to the smallest between these two numbers and inside this loop get the factors of the two numbers respectively by using the modulu operator amd checking the condition whether it gives the value zero or not. If the modulu between one of the number and the loop variable number accounts to zero then the loop variable number is definatively  factor of that number. After list of factors are collected between these two numbers respectively then we can extract the common numbers between this two list and finally the total multiplication of the common list is the HCF. But there is even more effecient and elite euclid's algorithm for calculating HCF. the algorithm works as:

```plaintext
1. Take two positive numbers a and b, where a > b > 0
2. Get the remainder/modulo between a and b as r
3. Check the remainder:
    If r = 0 then b is the HCF
    If r != 0,repeat from step 2 with the new numbers as a = b and b = r
```

In my code I have implemented this algorithm as:

```c
int hcf(int num1, int num2) {
    if (num1 <= 0 || num2 <= 0)
        return -1;

    if (num2 > num1)
        swap(&num1, &num2);
    
    if (num1 % num2 == 0)
        return num2;

    return hcf(num2, num1 % num2);
}
```

As we can now get all the calculations required for this problem, we now get the sum of natural numbers upto $n^{th} terms(based on the multipliers) for both the numbers and their LCM respectively. First we multiply the sum of natural numbers with the respective multipliers(a, b and LCM(a, b)) and sum the product of the two numbers nd substract the sum with the product that we got from the LCM part such as:

$solution = a \times sumOfNatiralNumbers(a) + b \times sumOfNatiralNumbers(b) - lcm(a,b) \times sumOfNatiralNumbers(lcm(a,b))$

In the code the way I have implemented this solution such as:

```c
int main() {
  int num1 = 3;
  int num2 = 5;
  int numsLcm = lcm(num1, num2);

  int sumBelow = 1000;

  int num1Nth = (sumBelow - 1) / num1;
  int num2Nth = (sumBelow - 1) / num2;
  int lcmNth = (sumBelow - 1) / numsLcm;

  int num1Sum = sumToN(num1Nth);
  int num2Sum = sumToN(num2Nth);
  int lcmSum = sumToN(lcmNth);

  int solution = (num1 * num1Sum) + (num2 * num2Sum) - (numsLcm * lcmSum);

  printf("Problem 1 solutions: %d", solution);

  return 0; 
}
```