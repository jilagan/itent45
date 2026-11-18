"""One-time: split index.html / machine.html into src/<page>/ parts."""
import re,sys,pathlib,json
root=pathlib.Path(__file__).resolve().parent.parent
for page in ("index","machine"):
    t=(root/f"{page}.html").read_text(encoding="utf-8")
    L=t.split("\n")
    s0=L.index("<style>"); s1=L.index("</style>")
    j0=max(i for i,x in enumerate(L) if x=="<script>" ) if False else next(i for i,x in enumerate(L) if x=="<script>" and i>s1)
    j1=max(i for i,x in enumerate(L) if x.startswith("</script>"))
    m1=next(i for i,x in enumerate(L) if x.strip()=="</main>")
    starts=[i for i,x in enumerate(L) if x.lstrip().startswith('<section class="panel') and i<m1]
    nums=dict(re.findall(r'data-p="([\w-]+)"\s+aria-selected="\w+"><span class="num">(\d+)',t))
    d=root/"src"/page; (d/"panels").mkdir(parents=True,exist_ok=True)
    order=[]
    for k,a in enumerate(starts):
        b=starts[k+1] if k+1<len(starts) else m1
        pid=re.search(r'id="p-([\w-]+)"',L[a]).group(1)
        fn=f"{nums.get(pid,'99')}-{pid}.html"; order.append(fn)
        (d/"panels"/fn).write_text("\n".join(L[a:b])+"\n",encoding="utf-8")
    (d/"style.css").write_text("\n".join(L[s0+1:s1])+"\n",encoding="utf-8")
    (d/"app.js").write_text("\n".join(L[j0+1:j1])+"\n",encoding="utf-8")
    shell=L[:s0+1]+["/*@@STYLE@@*/"]+L[s1:starts[0]]+["<!--@@PANELS@@-->"]+L[m1:j0+1]+["/*@@SCRIPT@@*/"]+L[j1:]
    (d/"shell.html").write_text("\n".join(shell),encoding="utf-8")
    (d/"order.json").write_text(json.dumps(order,indent=1)+"\n")
    print(page,len(order),"panels")
