LaTeX source of the Fall 2026 NLP Final Project Guide and Challenge Tracks (CSC5051 / CSC6052 / MDS5110, CUHK-Shenzhen).
The compiled PDF: https://nlp-course-cuhksz.github.io/materials/final_project/NLP-Final-Project-Guide-2026.pdf
The same content, with media and a Chinese version: https://nlp-course-cuhksz.github.io/final-project.html

Files
  NLP-Final-Project-Guide-2026-Expanded.tex   main text (question, schedule, design, deliverables, acknowledgments)
  tracks-appendix.tex                          appendices: tracks A-H, 79 briefs (generated from the web page sources)
  references.bib                               references (arXiv metadata fetched from the arXiv API)
  neurips_2026.sty                             the official NeurIPS 2026 style file, used with the preprint option

Build with XeLaTeX: xelatex, bibtex, xelatex, xelatex.
A few briefs contain Chinese characters, rendered with xeCJK and the Microsoft YaHei font (change \setCJKmainfont if it is unavailable);
the main font is TeX Gyre Termes. On Overleaf, set the compiler to XeLaTeX.
