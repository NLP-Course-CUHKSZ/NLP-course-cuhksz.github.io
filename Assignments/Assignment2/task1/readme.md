### Data item:
100 questions sampled from 2021 National Pharmacist Professional Qualification Examination real questions
Path: ./data/1.exam.json
```
{
    "question": "2. 根据《基本医疗保险⽤药管理暂⾏办法》和《2020年国家医保药品⽬录调整⼯作⽅案》，关于医保药品⽬录制定与调整的说法，正确的是（）。",
    "option": {
        "A": "医保⽬录调⼊分为常规准⼊和谈判准⼊两种⽅式，价格较⾼或者对医疗保险基⾦影响较⼤的专利独家药品应当通过谈判⽅式准⼊",
        "B": "统筹地区医疗保障主管部门建⽴完善医保药品⽬录动态调整机制，原则上每年调整⼀次",
        "C": "拟纳⼊《基本医疗保险药品⽬录》的化学药，可以由药品上市许可持有⼈按程序申报或者由临床专家按程序推荐，审核通过后调⼊医保药品⽬录",
        "D": "含国家珍贵、濒危野⽣动植物药材的药品根据需要可申请调⼊医保药品⽬录",
        "E": ""
    },
    "analysis": "A项，医保⽬录调⼊分为常规准⼊和谈判准⼊两种⽅式。在满⾜有效性、安全性等前提下，价格（费⽤）与药品⽬录内现有品种相当或较低的，可以通过常规⽅式纳⼊⽬录；价格较⾼或对医保基⾦影响较⼤的专利独家药品应当通过谈判⽅式准⼊。B项，国务院医疗保障主管部门建⽴完善医保药品⽬录动态调整机制，原则上每年调整⼀次。C项，纳⼊国家《药品⽬录》的药品，应当是经国家药品监督管理局批准，取得药品注册证书的化学药、⽣物制品、中成药（民族药），以及按国家标准炮制的中药饮⽚，并符合临床必需、安全有效、价格合理等基本条件。⽀持符合条件的基本药物按规定纳⼊《药品⽬录》。D项，含国家珍贵、濒危野⽣动植物药材的药品不得纳⼊国家《药品⽬录》。因此答案选A。",
    "answer": "A",
    "question_type": "最佳选择题",
    "source": "2021年执业药师职业资格考试《药事管理与法规》"
}
```

### Dependency
pip install langchain langchain_openai langchain_core tqdm jsonlines


### Running Steps:
0. Set up API keys for OpenAI in a file named `gpt3keys.txt` (one key per line)
1. bash 1.run_prepare_data.sh   
    - Prepare data for LangChain processing
    - You can adjust User_Prompt in this process
2. bash 2.run_gpt_datagen_multithread.sh
    - Uses LangChain to generate answers with multiple threads in parallel
    - Automatically rotates API keys for error handling and load balancing
    - Resumes processing if interrupted (skips already processed items)
3. bash 3.scorer.sh
    - Calculate scores and output wrong answers to facilitate analysis
    - You can adjust Answer extraction method


### Strategy recommendation:
1. Adjust User_Prompt
    - Adjust instruction such as "你是一个药剂师考试能手，每次都考100分，这道题对你来说不在话下，深呼吸，并一步一步思考，并给出正确的答案。"
    - Add some examples
    - ...
2. Adjust prompt template in LangChain
    - Modify the ChatPromptTemplate in langchain_datagen_multithread.py
    - Add system messages for better guidance
3. Leverage multiple rounds of dialogue
4. Optimize answer extraction method
5. Adjust model parameters like temperature and top_p
6. ...

