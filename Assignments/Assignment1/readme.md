Welcome to Assignment1 sub-repo

Here we will have the code and data template for assignment 1, feel free to modify it or code it from scratch
You are encouraged  to complete one and only one task listed below.

- Task1: LLMs as a knowledgeable doctor
- Task2: LLMs for AI feedback
- Task3: LLMs as a data quality evaluator
- Task4: Using LLMs to remove sensitive info
- Task5: Jailbreak
- Task6: Prompt Engineering for public benchmark
- Task7: Self-instruct
- Task8: Any other topics

Each task directory has related pipeline, code and data.

### The most basic practice
  1. put the gpt3keys.txt downloaded from weixin group into this directory(LLM-course.github.io\Assignments\Assignment1)
  2. run python OpenAIGPT.py
       - you can try different args introduced by tutorial
       - notion that if you change "n=1", you may also need adjust function(__post_process)   
  3. OpenAIGPT_datagen_multithread.py is for multi-threaded parallel generation of data of specific task.
       - learn about this code in one specific task's directory