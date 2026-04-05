export const topics = [
  {
    id: 'arrays',
    title: 'Arrays',
    difficulty: 'Easy',
    description: 'Master array manipulation, traversal, searching, and the most common interview patterns.',
    completed: 3,
    total: 12,
    color: 'from-violet-500 to-purple-600',
    icon: 'Layers',
    content: {
      explanation: `An array is a collection of elements stored at contiguous memory locations. It's the simplest and most widely used data structure.

Think of it like a row of lockers — each locker has a number (index) and you can directly access any locker if you know its number.

**Why Arrays?**
- O(1) access by index — instant lookup
- Simple to iterate and traverse
- Foundation for almost every other data structure

**Key Operations:**
- Access: O(1)
- Search: O(n)
- Insert at end: O(1) amortized
- Insert at middle: O(n)
- Delete: O(n)`,
      javaCode: `// Array Declaration and Usage in Java
public class ArrayExample {
    public static void main(String[] args) {
        // Declaration
        int[] arr = {5, 2, 8, 1, 9, 3};
        
        // Traversal
        System.out.println("Array elements:");
        for (int i = 0; i < arr.length; i++) {
            System.out.print(arr[i] + " ");
        }
        
        // Find max element
        int max = arr[0];
        for (int num : arr) {
            if (num > max) max = num;
        }
        System.out.println("\\nMax: " + max);
        
        // Two Pointer: Find pair with target sum
        int target = 10;
        int left = 0, right = arr.length - 1;
        // Sort first for two-pointer
        java.util.Arrays.sort(arr);
        while (left < right) {
            int sum = arr[left] + arr[right];
            if (sum == target) {
                System.out.println("Pair found: " + arr[left] + ", " + arr[right]);
                break;
            } else if (sum < target) left++;
            else right--;
        }
    }
}`,
      pythonCode: `# Array (List) in Python
arr = [5, 2, 8, 1, 9, 3]

# Traversal
print("Array elements:", arr)

# Find max element
max_val = max(arr)
print("Max:", max_val)

# Two Pointer: Find pair with target sum
arr.sort()
target = 10
left, right = 0, len(arr) - 1

while left < right:
    current_sum = arr[left] + arr[right]
    if current_sum == target:
        print(f"Pair found: {arr[left]}, {arr[right]}")
        break
    elif current_sum < target:
        left += 1
    else:
        right -= 1

# List comprehension (Python power feature)
squares = [x**2 for x in arr if x > 3]
print("Squares of elements > 3:", squares)`,
      dryRun: [
        { step: 1, description: 'Start with arr = [5, 2, 8, 1, 9, 3]', highlight: [] },
        { step: 2, description: 'Sort array → [1, 2, 3, 5, 8, 9]. Set left=0, right=5', highlight: [0, 5] },
        { step: 3, description: 'arr[0]+arr[5] = 1+9 = 10 ✅ Pair found!', highlight: [0, 5] },
      ],
      visualization: 'array'
    }
  },
  {
    id: 'binary-search',
    title: 'Binary Search',
    difficulty: 'Easy',
    description: 'Efficiently search sorted arrays by repeatedly halving the search space.',
    completed: 2,
    total: 8,
    color: 'from-cyan-500 to-blue-600',
    icon: 'Search',
    content: {
      explanation: `Binary Search is a divide-and-conquer algorithm that finds a target in a **sorted** array in O(log n) time.

**The Core Idea:**
Instead of checking every element (linear search, O(n)), binary search cuts the search space in half each time.

**Think of it like:** Finding a word in a dictionary. You don't start from page 1 — you open the middle, decide if your word comes before or after, then repeat.

**Requirements:**
- Array must be **sorted**
- Random access must be O(1) (works for arrays, not linked lists)

**Time Complexity:** O(log n) — for 1 million elements, only ~20 comparisons!
**Space Complexity:** O(1) iterative, O(log n) recursive`,
      javaCode: `// Binary Search in Java
public class BinarySearch {
    
    // Iterative approach
    public static int binarySearch(int[] arr, int target) {
        int left = 0, right = arr.length - 1;
        
        while (left <= right) {
            int mid = left + (right - left) / 2;  // Prevents overflow
            
            if (arr[mid] == target) {
                return mid;  // Found!
            } else if (arr[mid] < target) {
                left = mid + 1;  // Search right half
            } else {
                right = mid - 1;  // Search left half
            }
        }
        return -1;  // Not found
    }
    
    public static void main(String[] args) {
        int[] arr = {1, 3, 5, 7, 9, 11, 13, 15};
        int target = 7;
        
        int result = binarySearch(arr, target);
        System.out.println("Target " + target + " found at index: " + result);
    }
}`,
      pythonCode: `# Binary Search in Python

def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2  # Integer division
        
        if arr[mid] == target:
            return mid  # Found!
        elif arr[mid] < target:
            left = mid + 1  # Search right half
        else:
            right = mid - 1  # Search left half
    
    return -1  # Not found

# Test
arr = [1, 3, 5, 7, 9, 11, 13, 15]
target = 7

result = binary_search(arr, target)
print(f"Target {target} found at index: {result}")

# Python built-in (uses binary search internally!)
import bisect
idx = bisect.bisect_left(arr, target)
print(f"Using bisect: index {idx}")`,
      dryRun: [
        { step: 1, description: 'arr=[1,3,5,7,9,11,13,15], target=7. left=0, right=7', highlight: [] },
        { step: 2, description: 'mid=3, arr[3]=7 == target ✅ Found at index 3!', highlight: [3] },
      ],
      visualization: 'binary-search'
    }
  },
  {
    id: 'linked-list',
    title: 'Linked Lists',
    difficulty: 'Medium',
    description: 'Singly and doubly linked lists, pointer manipulation, and classic interview problems.',
    completed: 1,
    total: 14,
    color: 'from-pink-500 to-rose-600',
    icon: 'GitBranch',
    content: {
      explanation: `A linked list is a linear data structure where elements (nodes) are stored in non-contiguous memory, connected by pointers.

**Each node contains:**
- Data value
- Pointer(s) to next (and previous for doubly linked)

**vs Arrays:**
| | Array | Linked List |
|---|---|---|
| Access | O(1) | O(n) |
| Insert at head | O(n) | O(1) |
| Insert at tail | O(1) | O(n) |
| Memory | Contiguous | Scattered |

**Types:**
1. **Singly Linked List** — each node points to next
2. **Doubly Linked List** — each node points to next AND previous
3. **Circular Linked List** — last node points back to head`,
      javaCode: `// Linked List in Java
class Node {
    int data;
    Node next;
    Node(int data) { this.data = data; }
}

public class LinkedList {
    Node head;
    
    // Insert at beginning: O(1)
    void insertFront(int data) {
        Node newNode = new Node(data);
        newNode.next = head;
        head = newNode;
    }
    
    // Reverse linked list (classic interview!)
    Node reverse(Node head) {
        Node prev = null, curr = head;
        while (curr != null) {
            Node next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
        }
        return prev;
    }
    
    // Detect cycle (Floyd's Algorithm)
    boolean hasCycle(Node head) {
        Node slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return true;
        }
        return false;
    }
}`,
      pythonCode: `# Linked List in Python
class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

class LinkedList:
    def __init__(self):
        self.head = None
    
    # Insert at front: O(1)
    def insert_front(self, data):
        new_node = Node(data)
        new_node.next = self.head
        self.head = new_node
    
    # Reverse linked list
    def reverse(self):
        prev, curr = None, self.head
        while curr:
            next_node = curr.next
            curr.next = prev
            prev = curr
            curr = next_node
        self.head = prev
    
    # Detect cycle (Floyd's Algorithm)
    def has_cycle(self):
        slow = fast = self.head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow == fast:
                return True
        return False
    
    def print_list(self):
        curr = self.head
        while curr:
            print(curr.data, end=" -> ")
            curr = curr.next
        print("None")`,
      dryRun: [
        { step: 1, description: 'Create list: 1 → 2 → 3 → 4 → None', highlight: [] },
        { step: 2, description: 'Reverse: prev=None, curr=1. Save next=2, set 1→None', highlight: [0] },
        { step: 3, description: 'prev=1, curr=2. Save next=3, set 2→1', highlight: [1] },
        { step: 4, description: 'Continue until None → 4→3→2→1→None ✅', highlight: [] },
      ],
      visualization: 'array'
    }
  },
  {
    id: 'trees',
    title: 'Trees & BST',
    difficulty: 'Medium',
    description: 'Binary trees, DFS/BFS traversals, BST operations and recursive thinking.',
    completed: 0,
    total: 16,
    color: 'from-emerald-500 to-green-600',
    icon: 'Network',
    content: {
      explanation: `A tree is a hierarchical data structure consisting of nodes connected by edges. Unlike linear structures, trees have a parent-child relationship.

**Key Terms:**
- **Root** — topmost node (no parent)
- **Leaf** — node with no children
- **Height** — longest path from root to leaf
- **Depth** — distance from root to node

**Binary Tree:** Each node has at most 2 children (left, right)

**BST Property:** left child < parent < right child — enables O(log n) search!

**Traversals:**
- **Inorder (L→Root→R):** gives sorted output for BST
- **Preorder (Root→L→R):** useful for copying tree
- **Postorder (L→R→Root):** useful for deletion
- **BFS (Level-order):** level by level using queue`,
      javaCode: `// Binary Tree in Java
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

public class BinaryTree {
    
    // Inorder: Left → Root → Right
    void inorder(TreeNode root) {
        if (root == null) return;
        inorder(root.left);
        System.out.print(root.val + " ");
        inorder(root.right);
    }
    
    // Level Order (BFS)
    void levelOrder(TreeNode root) {
        if (root == null) return;
        Queue<TreeNode> queue = new LinkedList<>();
        queue.add(root);
        while (!queue.isEmpty()) {
            TreeNode node = queue.poll();
            System.out.print(node.val + " ");
            if (node.left != null)  queue.add(node.left);
            if (node.right != null) queue.add(node.right);
        }
    }
    
    // Max depth
    int maxDepth(TreeNode root) {
        if (root == null) return 0;
        return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
    }
}`,
      pythonCode: `# Binary Tree in Python
from collections import deque

class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

class BinaryTree:
    
    # Inorder: Left → Root → Right
    def inorder(self, root):
        if not root:
            return []
        return self.inorder(root.left) + [root.val] + self.inorder(root.right)
    
    # Level Order (BFS)
    def level_order(self, root):
        if not root:
            return []
        result, queue = [], deque([root])
        while queue:
            node = queue.popleft()
            result.append(node.val)
            if node.left:  queue.append(node.left)
            if node.right: queue.append(node.right)
        return result
    
    # Max depth
    def max_depth(self, root):
        if not root:
            return 0
        return 1 + max(self.max_depth(root.left), self.max_depth(root.right))`,
      dryRun: [
        { step: 1, description: 'Tree:    4\n      2   6\n    1  3 5  7', highlight: [] },
        { step: 2, description: 'Inorder: Go left to 1 (leaf), visit 1', highlight: [] },
        { step: 3, description: 'Backtrack to 2, visit 2', highlight: [] },
        { step: 4, description: 'Go right to 3, visit 3. Backtrack to root 4', highlight: [] },
        { step: 5, description: 'Visit root 4. Then right subtree: 5, 6, 7', highlight: [] },
        { step: 6, description: 'Result: 1 2 3 4 5 6 7 ✅ (sorted for BST!)', highlight: [] },
      ],
      visualization: 'tree'
    }
  },
  {
    id: 'graphs',
    title: 'Graphs',
    difficulty: 'Hard',
    description: 'BFS, DFS, shortest paths, topological sort and real-world graph problems.',
    completed: 0,
    total: 20,
    color: 'from-orange-500 to-red-600',
    icon: 'Box',
    content: {
      explanation: `A graph is a collection of **vertices (nodes)** connected by **edges**. Graphs model complex real-world systems like social networks, maps, and dependency graphs.

**Types:**
- **Directed** — edges have direction (A→B ≠ B→A)
- **Undirected** — edges are bidirectional
- **Weighted** — edges have weights/costs
- **Cyclic / Acyclic**

**Representations:**
- **Adjacency List** — best for sparse graphs, O(V+E) space
- **Adjacency Matrix** — best for dense graphs, O(V²) space

**Key Algorithms:**
- **BFS** — shortest path in unweighted graph, level-by-level
- **DFS** — cycle detection, topological sort, connected components
- **Dijkstra** — shortest path in weighted graph`,
      javaCode: `// Graph BFS & DFS in Java
import java.util.*;

public class Graph {
    Map<Integer, List<Integer>> adj = new HashMap<>();
    
    void addEdge(int u, int v) {
        adj.computeIfAbsent(u, k -> new ArrayList<>()).add(v);
        adj.computeIfAbsent(v, k -> new ArrayList<>()).add(u);
    }
    
    // BFS - Shortest path (unweighted)
    void bfs(int start) {
        Set<Integer> visited = new HashSet<>();
        Queue<Integer> queue = new LinkedList<>();
        queue.add(start);
        visited.add(start);
        
        while (!queue.isEmpty()) {
            int node = queue.poll();
            System.out.print(node + " ");
            for (int neighbor : adj.getOrDefault(node, new ArrayList<>())) {
                if (!visited.contains(neighbor)) {
                    visited.add(neighbor);
                    queue.add(neighbor);
                }
            }
        }
    }
    
    // DFS - Recursive
    void dfs(int node, Set<Integer> visited) {
        visited.add(node);
        System.out.print(node + " ");
        for (int neighbor : adj.getOrDefault(node, new ArrayList<>())) {
            if (!visited.contains(neighbor)) {
                dfs(neighbor, visited);
            }
        }
    }
}`,
      pythonCode: `# Graph BFS & DFS in Python
from collections import defaultdict, deque

class Graph:
    def __init__(self):
        self.adj = defaultdict(list)
    
    def add_edge(self, u, v):
        self.adj[u].append(v)
        self.adj[v].append(u)  # undirected
    
    # BFS - Shortest path (unweighted)
    def bfs(self, start):
        visited = {start}
        queue = deque([start])
        result = []
        
        while queue:
            node = queue.popleft()
            result.append(node)
            for neighbor in self.adj[node]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return result
    
    # DFS - Iterative
    def dfs(self, start):
        visited = set()
        stack = [start]
        result = []
        
        while stack:
            node = stack.pop()
            if node not in visited:
                visited.add(node)
                result.append(node)
                stack.extend(self.adj[node])
        return result`,
      dryRun: [
        { step: 1, description: 'Graph: 0-1, 0-2, 1-3, 2-3. BFS from 0', highlight: [] },
        { step: 2, description: 'Queue: [0]. Visit 0 → Queue: [1, 2]', highlight: [] },
        { step: 3, description: 'Dequeue 1. Visit 1 → Queue: [2, 3]', highlight: [] },
        { step: 4, description: 'Dequeue 2. Visit 2 → 3 already in queue', highlight: [] },
        { step: 5, description: 'Dequeue 3. BFS order: 0 → 1 → 2 → 3 ✅', highlight: [] },
      ],
      visualization: 'array'
    }
  },
  {
    id: 'dynamic-programming',
    title: 'Dynamic Programming',
    difficulty: 'Hard',
    description: 'Master memoization, tabulation, and recognize DP patterns in interview problems.',
    completed: 0,
    total: 18,
    color: 'from-amber-500 to-yellow-600',
    icon: 'Zap',
    content: {
      explanation: `Dynamic Programming (DP) is an optimization technique that solves complex problems by breaking them into overlapping subproblems and storing results to avoid recomputation.

**Two approaches:**
1. **Memoization (Top-Down):** Solve recursively, cache results
2. **Tabulation (Bottom-Up):** Start from base cases, build up

**When to use DP?**
- Optimization problem (min/max)
- Counting problems
- Has overlapping subproblems
- Optimal substructure property

**Classic DP Patterns:**
- Fibonacci / House Robber (1D DP)
- 0/1 Knapsack (2D DP)
- Longest Common Subsequence
- Coin Change
- Matrix Path Problems`,
      javaCode: `// Dynamic Programming Examples in Java
public class DPExamples {
    
    // Fibonacci - Memoization
    Map<Integer, Long> memo = new HashMap<>();
    long fib(int n) {
        if (n <= 1) return n;
        if (memo.containsKey(n)) return memo.get(n);
        long result = fib(n-1) + fib(n-2);
        memo.put(n, result);
        return result;
    }
    
    // Coin Change - Tabulation (Classic DP!)
    int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);  // Initialize with "infinity"
        dp[0] = 0;
        
        for (int i = 1; i <= amount; i++) {
            for (int coin : coins) {
                if (coin <= i) {
                    dp[i] = Math.min(dp[i], dp[i - coin] + 1);
                }
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
    
    // Longest Common Subsequence
    int lcs(String s1, String s2) {
        int m = s1.length(), n = s2.length();
        int[][] dp = new int[m+1][n+1];
        for (int i = 1; i <= m; i++)
            for (int j = 1; j <= n; j++)
                dp[i][j] = s1.charAt(i-1) == s2.charAt(j-1)
                    ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
        return dp[m][n];
    }
}`,
      pythonCode: `# Dynamic Programming in Python
from functools import lru_cache

# Fibonacci with memoization (using decorator)
@lru_cache(maxsize=None)
def fib(n):
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)

# Coin Change - Tabulation
def coin_change(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    
    for i in range(1, amount + 1):
        for coin in coins:
            if coin <= i:
                dp[i] = min(dp[i], dp[i - coin] + 1)
    
    return dp[amount] if dp[amount] != float('inf') else -1

# Longest Common Subsequence
def lcs(s1, s2):
    m, n = len(s1), len(s2)
    dp = [[0] * (n+1) for _ in range(m+1)]
    
    for i in range(1, m+1):
        for j in range(1, n+1):
            if s1[i-1] == s2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    
    return dp[m][n]

# Test
print(fib(10))  # 55
print(coin_change([1, 5, 10, 25], 36))  # 3
print(lcs("ABCBDAB", "BDCABA"))  # 4`,
      dryRun: [
        { step: 1, description: 'coinChange([1,5,10], amount=11). dp[0]=0', highlight: [] },
        { step: 2, description: 'dp[1]=dp[0]+1=1 (coin=1)', highlight: [] },
        { step: 3, description: 'dp[5]=min(dp[4]+1, dp[0]+1)=1 (coin=5)', highlight: [] },
        { step: 4, description: 'dp[10]=min(dp[9]+1, dp[5]+1, dp[0]+1)=1 (coin=10)', highlight: [] },
        { step: 5, description: 'dp[11]=min(dp[10]+1, dp[6]+1, dp[1]+1)=2 ✅', highlight: [] },
      ],
      visualization: 'array'
    }
  },
  {
    id: 'stack',
    title: 'Stack',
    difficulty: 'Easy',
    description: 'Master LIFO stacks — the foundation of recursion, undo systems, and more.',
    completed: 0,
    total: 5,
    color: 'from-teal-500 to-cyan-600',
    icon: 'Layers',
    content: {
      explanation: `A **Stack** is a LIFO (Last In, First Out) data structure — like a stack of plates.\n\n**Stack Operations:**\n- push(x) — add to top: O(1)\n- pop() — remove from top: O(1)\n- peek() — view top: O(1)\n\n**Real-world uses:**\n- Function call stack, undo/redo, browser back button, DFS`,
      javaCode: `// Stack in Java
import java.util.*;

public class StackDemo {
    public static void main(String[] args) {
        // ── STACK (Deque is preferred over Stack class) ──
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(10);
        stack.push(20);
        stack.push(30);
        System.out.println("Peek: " + stack.peek());    // 30
        System.out.println("Pop: "  + stack.pop());     // 30
        System.out.println("Size: " + stack.size());    // 2

        // ── Classic: Valid Parentheses using Stack ──
        System.out.println(isValid("({[]})"));  // true
    }

    static boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            if ("({[".indexOf(c) >= 0) { stack.push(c); }
            else {
                if (stack.isEmpty()) return false;
                char top = stack.pop();
                if (c == ')' && top != '(') return false;
                if (c == '}' && top != '{') return false;
                if (c == ']' && top != '[') return false;
            }
        }
        return stack.isEmpty();
    }
}`,
      pythonCode: `# Stack in Python
# ── STACK (use list) ──
stack = []
stack.append(10)   # push
stack.append(20)
stack.append(30)
print("Peek:", stack[-1])  # 30
print("Pop:", stack.pop()) # 30

# ── Classic: Valid Parentheses ──
def is_valid(s):
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    for c in s:
        if c in '({[':
            stack.append(c)
        else:
            if not stack or stack[-1] != pairs[c]:
                return False
            stack.pop()
    return len(stack) == 0

print(is_valid("({[]})"))  # True`,
      dryRun: [
        { step: 1, description: 'Push 10, 20, 30 → Stack: [10, 20, 30]. Top = 30', highlight: [] },
        { step: 2, description: 'Peek → returns 30, stack unchanged', highlight: [] },
        { step: 3, description: 'Pop → removes 30. Stack: [10, 20]. Top = 20', highlight: [] }
      ],
      visualization: 'stack'
    }
  },
  {
    id: 'queue',
    title: 'Queue',
    difficulty: 'Easy',
    description: 'Master FIFO queues — essential for BFS and scheduling tasks.',
    completed: 0,
    total: 5,
    color: 'from-blue-500 to-indigo-600',
    icon: 'ListOrdered',
    content: {
      explanation: `A **Queue** is FIFO (First In, First Out) — like a line at a ticket counter.\n\n**Queue Operations:**\n- enqueue(x) — add to rear: O(1)\n- dequeue() — remove from front: O(1)\n- peek() — view front: O(1)\n\n**Real-world uses:**\n- BFS traversal, CPU scheduling, print spooler, task queues`,
      javaCode: `// Queue in Java
import java.util.*;

public class QueueDemo {
    public static void main(String[] args) {
        // ── QUEUE ──
        Queue<Integer> queue = new LinkedList<>();
        queue.offer(10);
        queue.offer(20);
        queue.offer(30);
        System.out.println("Front: "   + queue.peek());   // 10
        System.out.println("Dequeue: " + queue.poll());   // 10
        System.out.println("Size: " + queue.size());      // 2
    }
}`,
      pythonCode: `# Queue in Python
from collections import deque

# ── QUEUE (use deque for O(1) both ends) ──
queue = deque()
queue.append(10)    # enqueue
queue.append(20)
queue.append(30)
print("Front:", queue[0])       # 10
print("Dequeue:", queue.popleft()) # 10`,
      dryRun: [
        { step: 1, description: 'Enqueue 10, 20, 30 → Queue: [10, 20, 30]. Front = 10', highlight: [] },
        { step: 2, description: 'Peek → returns 10, queue unchanged', highlight: [] },
        { step: 3, description: 'Dequeue → removes 10. Queue: [20, 30]. Front = 20 ✅', highlight: [] }
      ],
      visualization: 'queue'
    }
  },
  {
    id: 'sorting',
    title: 'Sorting Algorithms',
    difficulty: 'Medium',
    description: 'Bubble, Merge, Quick Sort and more — understand time complexity through visual comparison.',
    completed: 0,
    total: 10,
    color: 'from-purple-500 to-indigo-600',
    icon: 'BarChart2',
    content: {
      explanation: `Sorting algorithms arrange elements in a specific order (usually ascending or descending).\n\n**Key algorithms:**\n- **Bubble Sort** – O(n²): compare adjacent elements, swap if needed\n- **Selection Sort** – O(n²): find minimum, place at front\n- **Insertion Sort** – O(n²): build sorted portion left-to-right\n- **Merge Sort** – O(n log n): divide and conquer, stable\n- **Quick Sort** – O(n log n) avg: pivot-based partitioning\n\n**Choosing the right sort:**\n- Small arrays → Insertion Sort\n- General purpose → Quick or Merge Sort\n- Stability needed → Merge Sort`,
      javaCode: `// Sorting in Java
import java.util.Arrays;

public class Sorting {
    // Bubble Sort
    static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++)
            for (int j = 0; j < n - i - 1; j++)
                if (arr[j] > arr[j + 1]) {
                    int tmp = arr[j]; arr[j] = arr[j+1]; arr[j+1] = tmp;
                }
    }

    // Merge Sort
    static void mergeSort(int[] arr, int left, int right) {
        if (left >= right) return;
        int mid = (left + right) / 2;
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }

    static void merge(int[] arr, int l, int m, int r) {
        int[] tmp = Arrays.copyOfRange(arr, l, r + 1);
        int i = 0, j = m - l + 1, k = l;
        while (i <= m - l && j < tmp.length)
            arr[k++] = tmp[i] <= tmp[j] ? tmp[i++] : tmp[j++];
        while (i <= m - l) arr[k++] = tmp[i++];
        while (j < tmp.length) arr[k++] = tmp[j++];
    }
}`,
      pythonCode: `# Sorting in Python
def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left  = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i]); i += 1
        else:
            result.append(right[j]); j += 1
    return result + left[i:] + right[j:]

print(bubble_sort([64, 34, 25, 12, 22, 11, 90]))
print(merge_sort([38, 27, 43, 3, 9, 82, 10]))`,
      dryRun: [
        { step: 1, description: 'Bubble Sort: arr=[5,3,8,1]. Compare 5>3 → swap → [3,5,8,1]', highlight: [] },
        { step: 2, description: 'Compare 5<8 → no swap. Compare 8>1 → swap → [3,5,1,8]', highlight: [] },
        { step: 3, description: 'Pass 2: [3,5,1,8] → compare 5>1 → swap → [3,1,5,8]', highlight: [] },
        { step: 4, description: 'Pass 3: [3,1,5,8] → compare 3>1 → swap → [1,3,5,8] ✅', highlight: [] },
      ],
      visualization: 'sorting'
    }
  }
]
