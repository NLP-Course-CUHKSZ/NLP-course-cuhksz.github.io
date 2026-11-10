LaTeX source of the Fall 2026 NLP Final Project Guide and Challenge Tracks (CSC5051 / CSC6052 / MDS5110, CUHK-Shenzhen).
The compiled PDF: https://nlp-course-cuhksz.github.io/materials/final_project/NLP-Final-Project-Guide-2026.pdf
The same content as a web page, with embedded videos, a track finder and a Chinese version: https://nlp-course-cuhksz.github.io/final-project.html

The PDF follows the web page section by section. Everything after the abstract is generated from the page's sources, so the two say the same thing:
  NLP-Final-Project-Guide-2026-Expanded.tex   preamble, title, abstract; inputs the files below
  gen-main.tex                                 sections 1-4: the question and the tracks, schedule and grading, research playbook, FAQ
  gen-ack.tex                                  acknowledgments
  tracks-appendix.tex                          appendices A-H: the eight tracks, 79 briefs, and their reading and video lists
  gen-courses.tex                              appendices I-J: other courses and labs, toolbox
  references.bib                               references (arXiv metadata fetched from the arXiv API)
  neurips_2026.sty                             the official NeurIPS 2026 style file, used with the preprint option

Build with XeLaTeX: xelatex, bibtex, xelatex, xelatex.
A few briefs contain Chinese characters, rendered with xeCJK and the Microsoft YaHei font (change \setCJKmainfont if it is unavailable);
the main font is TeX Gyre Termes. On Overleaf, set the compiler to XeLaTeX.
