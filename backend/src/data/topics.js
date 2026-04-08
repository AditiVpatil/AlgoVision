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
      cppCode: `// Array Usage in C++
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    // std::vector is a dynamic array in C++
    std::vector<int> arr = {5, 2, 8, 1, 9, 3};
    
    // Traversal
    for (int x : arr) std::cout << x << " ";
    std::cout << std::endl;
    
    // Find max
    int maxVal = *std::max_element(arr.begin(), arr.end());
    std::cout << "Max: " << maxVal << std::endl;
    
    // Two Pointer on sorted vector
    std::sort(arr.begin(), arr.end());
    int left = 0, right = arr.size() - 1, target = 10;
    while (left < right) {
        int sum = arr[left] + arr[right];
        if (sum == target) {
            std::cout << "Pair: " << arr[left] << "," << arr[right] << std::endl;
            break;
        }
        sum < target ? left++ : right--;
    }
    return 0;
}`,
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
      visualization: 'array',
      quiz: [
        {
          id: 1,
          question: "What is the time complexity of accessing an element in an array by its index?",
          options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
          answer: 0,
          explanation: "Arrays offer constant time access (O(1)) to any element if the index is known, thanks to contiguous memory."
        },
        {
          id: 2,
          question: "Which of the following is a disadvantage of arrays?",
          options: ["Slow access", "Static size in many languages", "Too much memory", "Hard to traverse"],
          answer: 1,
          explanation: "Fixed-size arrays cannot be resized easily, often requiring a new array allocation and element copying."
        },
        {
          id: 3,
          question: "Which operation is most inefficient in a sorted array compared to an unsorted one?",
          options: ["Accessing", "Search", "Insertion", "Deletion"],
          answer: 2,
          explanation: "In a sorted array, insertion requires shifting elements to maintain order, taking O(n) time."
        },
        {
          id: 4,
          question: "When should you use a dynamic array (like ArrayList / vector) instead of a static array?",
          options: ["When size is unknown at compile time", "When you need O(1) access", "When memory is tight", "When data is sorted"],
          answer: 0,
          explanation: "Dynamic arrays can resize themselves, making them ideal when the total count of elements is not fixed upfront."
        },
        {
          id: 5,
          question: "What is the space complexity of an array of size 'n'?",
          options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
          answer: 1,
          explanation: "An array of size n takes space proportional to n, hence O(n)."
        }
      ]
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
      cppCode: `// Binary Search in C++
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> arr = {1, 3, 5, 7, 9, 11, 13, 15};
    int target = 7;
    int left = 0, right = arr.size() - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) {
            std::cout << "Found at index " << mid << std::endl;
            return 0;
        }
        arr[mid] < target ? left = mid + 1 : right = mid - 1;
    }
    std::cout << "Not found" << std::endl;
    return 0;
}`,
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
      visualization: 'binary-search',
      quiz: [
        {
          id: 1,
          question: "Binary search requires the array to be:",
          options: ["Unsorted", "Sorted", "Large", "Small"],
          answer: 1,
          explanation: "Binary search works by comparing the middle element; this only eliminates half the search space if the array is sorted."
        },
        {
          id: 2,
          question: "What is the worst-case time complexity of Binary Search?",
          options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
          answer: 1,
          explanation: "Since we halve the search space at each step, we can find the element in log2(n) steps."
        },
        {
          id: 3,
          question: "When would Binary Search be slower than Linear Search?",
          options: ["Always", "Never", "Small array and unsorted", "Very large array"],
          answer: 2,
          explanation: "Total time for Binary Search includes sorting time (O(n log n)). For small unsorted arrays, a quick O(n) linear scan is faster than sorting + searching."
        },
        {
          id: 4,
          question: "Can Binary Search be used on a Linked List?",
          options: ["Yes, with O(log n)", "Yes, with O(n)", "No, impossible", "Only if it is a Skip List"],
          answer: 1,
          explanation: "Binary search requires O(1) random access to find 'mid'. Since linked lists take O(n) to reach the middle, the complexity becomes O(n), negating the benefit."
        },
        {
          id: 5,
          question: "What happens if we use '(left + right) / 2' directly in Java/C++?",
          options: ["Always works", "Division error", "Potential integer overflow", "Negative index error"],
          answer: 2,
          explanation: "If 'left' and 'right' are large, their sum can exceed the maximum integer value. 'left + (right - left) / 2' is the safe version."
        }
      ]
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
      cppCode: `// Linked List in C++
#include <iostream>

struct Node {
    int data;
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

class LinkedList {
public:
    Node* head = nullptr;
    void insertFront(int val) {
        Node* newNode = new Node(val);
        newNode->next = head;
        head = newNode;
    }
};

int main() {
    LinkedList ll;
    ll.insertFront(10);
    ll.insertFront(20);
    return 0;
}`,
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
      visualization: 'array',
      quiz: [
        {
          id: 1,
          question: "What is the time complexity of inserting a node at the front of a singly linked list?",
          options: ["O(n)", "O(1)", "O(log n)", "O(n^2)"],
          answer: 1,
          explanation: "To insert at the front, we only need to update the new node's next pointer and the head pointer, which is O(1)."
        },
        {
          id: 2,
          question: "A doubly linked list node contains how many pointers?",
          options: ["One", "Two", "Three", "Zero"],
          answer: 1,
          explanation: "Doubly linked list nodes contain a pointer to both the next and the previous node."
        }
      ]
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
      cppCode: `// Binary Tree in C++
#include <iostream>
#include <queue>
#include <algorithm>

struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

class BinaryTree {
public:
    // Inorder: Left → Root → Right
    void inorder(TreeNode* root) {
        if (!root) return;
        inorder(root->left);
        std::cout << root->val << " ";
        inorder(root->right);
    }
    
    // Level Order (BFS)
    void levelOrder(TreeNode* root) {
        if (!root) return;
        std::queue<TreeNode*> q;
        q.push(root);
        while (!q.empty()) {
            TreeNode* node = q.front(); q.pop();
            std::cout << node->val << " ";
            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }
    }
};`,
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
      visualization: 'tree',
      quiz: [
        {
          id: 1,
          question: "In a Binary Search Tree (BST), the left child is always:",
          options: ["Greater than the parent", "Smaller than the parent", "Equal to the parent", "Twice the parent"],
          answer: 1,
          explanation: "The core property of a BST is that for any node, left descendants are smaller and right descendants are larger."
        },
        {
          id: 2,
          question: "Which traversal of a BST yields a sorted order of elements?",
          options: ["Preorder", "Postorder", "Inorder", "Level-order"],
          answer: 2,
          explanation: "Inorder traversal (Left → Root → Right) visits BST nodes in non-decreasing order."
        },
        {
          id: 3,
          question: "What is the maximum number of nodes in a binary tree of height 'h' (starting h=0)?",
          options: ["2^h", "2^(h+1) - 1", "2^h - 1", "h^2"],
          answer: 1,
          explanation: "A full binary tree has 2^(h+1) - 1 nodes. For example, height 0 has 2^1 - 1 = 1 node."
        },
        {
          id: 4,
          question: "Which data structure is typically used for Level Order Traversal?",
          options: ["Stack", "Queue", "Priority Queue", "Hash Map"],
          answer: 1,
          explanation: "Level order traversal (BFS) uses a Queue to visit nodes level by level."
        },
        {
          id: 5,
          question: "What is the time complexity of searching in a balanced BST?",
          options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
          answer: 2,
          explanation: "In a balanced tree, we eliminate half the search space at each step, leading to logarithmic time."
        }
      ]
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
      visualization: 'array',
      quiz: [
        {
          id: 1,
          question: "Which algorithm is best for finding the shortest path in an unweighted graph?",
          options: ["DFS", "BFS", "Dijkstra", "Prim"],
          answer: 1,
          explanation: "BFS explores nodes level by level, ensuring it finds the shortest path (minimum edges) in unweighted graphs."
        },
        {
          id: 2,
          question: "What data structure is typically used for a BFS traversal?",
          options: ["Stack", "Queue", "Heap", "Hash Map"],
          answer: 1,
          explanation: "BFS uses a Queue (First In, First Out) to keep track of nodes yet to be visited level-by-level."
        },
        {
          id: 3,
          question: "What is the time complexity for BFS/DFS on an adjacency list?",
          options: ["O(V)", "O(E)", "O(V + E)", "O(V * E)"],
          answer: 2,
          explanation: "We visit every vertex once and every edge once/twice, so it's linear in terms of the total graph size."
        },
        {
          id: 4,
          question: "Which algorithm finds the shortest path in an unweighted graph?",
          options: ["DFS", "BFS", "Dijkstra", "Kruskal"],
          answer: 1,
          explanation: "BFS explores all nodes at distance 1, then distance 2, etc., ensuring the first time we hit the target, it's via the shortest path."
        },
        {
          id: 5,
          question: "A graph with no cycles is called a:",
          options: ["Complete Graph", "Acyclic Graph", "Bipartite Graph", "Connected Graph"],
          answer: 1,
          explanation: "A graph without cycles is 'acyclic'. A connected acyclic graph is specifically a tree."
        }
      ]
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
      cppCode: `// Dynamic Programming in C++
#include <iostream>
#include <vector>
#include <algorithm>
#include <string>

// Fibonacci with memoization
long long fib(int n, std::vector<long long>& memo) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];
    return memo[n] = fib(n-1, memo) + fib(n-2, memo);
}

// Coin Change - Tabulation
int coinChange(std::vector<int>& coins, int amount) {
    std::vector<int> dp(amount + 1, amount + 1);
    dp[0] = 0;
    for (int i = 1; i <= amount; i++) {
        for (int coin : coins) {
            if (coin <= i) dp[i] = std::min(dp[i], dp[i - coin] + 1);
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}`,
    
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
      visualization: 'array',
      quiz: [
        {
          id: 1,
          question: "Dynamic Programming is based on which approach?",
          options: ["Greedy", "Divide and Conquer", "Guessing", "Memoization / Tabulation"],
          answer: 3,
          explanation: "DP optimizes by storing results of subproblems (memoization or tabulation) to avoid redundant calculations."
        },
        {
          id: 2,
          question: "Which of the following is a classic DP problem?",
          options: ["Binary Search", "Knapsack Problem", "Quick Sort", "DFS"],
          answer: 1,
          explanation: "The 0/1 Knapsack problem is a classic example of overlapping subproblems and optimal substructure, perfect for DP."
        },
        {
          id: 3,
          question: "What is the main difference between Memoization and Tabulation?",
          options: ["Memoization is Top-Down, Tabulation is Bottom-Up", "Memoization uses a stack, Tabulation uses a queue", "Memoization is O(n^2), Tabulation is O(n)", "There is no difference"],
          answer: 0,
          explanation: "Memoization (Top-Down) uses recursion and caching, while Tabulation (Bottom-Up) uses an iterative approach and a table."
        },
        {
          id: 4,
          question: "The 'optimal substructure' property means:",
          options: ["The problem can be solved greedily", "The optimal solution involves subproblems", "An optimal solution for the problem contains optimal solutions to subproblems", "The problem has no cycles"],
          answer: 2,
          explanation: "Optimal substructure is a requirement for DP where global optima can be constructed from local optima of sub-problems."
        },
        {
          id: 5,
          question: "Which of the following is NOT required for a problem to be solved using DP?",
          options: ["Overlapping subproblems", "Optimal substructure", "Sorting the input", "State definition"],
          answer: 2,
          explanation: "Sorting is not a core requirement for DP, though some DP problems (like LIS) might involve it in certain optimizations."
        }
      ]
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
      cppCode: `// Stack in C++
#include <stack>
#include <iostream>

int main() {
    std::stack<int> s;
    s.push(10);
    s.push(20);
    std::cout << "Top: " << s.top() << std::endl; // 20
    s.pop();
    return 0;
}`,
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
      visualization: 'stack',
      quiz: [
        { id: 1, question: "Which principle does a Stack follow?", options: ["FIFO", "LIFO", "LILO", "Random"], answer: 1, explanation: "Last-In-First-Out means the most recently added item is the first one removed." },
        { id: 2, question: "What is the time complexity of a 'pop' operation?", options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"], answer: 0, explanation: "Popping from the top is a constant time operation." }
      ]
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
      cppCode: `// Queue in C++
#include <queue>
#include <iostream>

int main() {
    std::queue<int> q;
    q.push(10); // enqueue
    std::cout << "Front: " << q.front() << std::endl;
    q.pop(); // dequeue
    return 0;
}`,
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
      visualization: 'queue',
      quiz: [
        { id: 1, question: "Which principle does a Queue follow?", options: ["FIFO", "LIFO", "LILO", "Random"], answer: 0, explanation: "First-In-First-Out means the first item added is the first one removed." },
        { id: 2, question: "Where is an element added in a queue?", options: ["Middle", "Front", "Back", "Anywhere"], answer: 2, explanation: "Enqueue operation always adds elements to the back (rear) of the queue." }
      ]
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
];
