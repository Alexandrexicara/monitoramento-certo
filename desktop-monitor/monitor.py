import re, time, threading, queue, tkinter as tk
from tkinter import ttk, messagebox
from datetime import datetime, timezone
import requests
import mss
import numpy as np
from rapidocr_onnxruntime import RapidOCR

API_DEFAULT = "https://monitor-aviator-api.onrender.com"
class RegionPicker:
    def __init__(self, root, done):
        self.done=done
        self.win=tk.Toplevel(root); self.win.attributes("-fullscreen", True); self.win.attributes("-alpha", .28); self.win.attributes("-topmost", True)
        self.win.configure(bg="black"); self.canvas=tk.Canvas(self.win,bg="black",cursor="cross"); self.canvas.pack(fill="both",expand=True)
        self.canvas.create_text(30,30,anchor="nw",fill="white",font=("Segoe UI",18),text="Arraste para selecionar a área onde aparece o multiplicador. ESC cancela.")
        self.start=None; self.rect=None
        self.canvas.bind("<ButtonPress-1>",self.down); self.canvas.bind("<B1-Motion>",self.move); self.canvas.bind("<ButtonRelease-1>",self.up)
        self.win.bind("<Escape>",lambda e:self.win.destroy())
    def down(self,e): self.start=(e.x_root,e.y_root); self.rect=self.canvas.create_rectangle(e.x,e.y,e.x,e.y,outline="lime",width=3)
    def move(self,e):
        if self.start:
            x1,y1=self.start; self.canvas.coords(self.rect,x1,y1,e.x_root,e.y_root)
    def up(self,e):
        if self.start:
            x1,y1=self.start; x2,y2=e.x_root,e.y_root
            self.win.destroy()
            if abs(x2-x1)>15 and abs(y2-y1)>10: self.done({"left":min(x1,x2),"top":min(y1,y2),"width":abs(x2-x1),"height":abs(y2-y1)})

class App:
    def __init__(self,root):
        self.root=root; root.title("AssistPro — Monitor Aviator"); root.geometry("570x470"); root.minsize(520,420)
        self.region=None; self.running=False; self.worker=None; self.events=queue.Queue(); self.last_seen={}; self.ocr=RapidOCR()
        self.api=tk.StringVar(value=API_DEFAULT); self.status=tk.StringVar(value="Pronto para selecionar a área do multiplicador.")
        self.region_label=tk.StringVar(value="Área não selecionada")
        box=ttk.Frame(root,padding=16); box.pack(fill="both",expand=True)
        ttk.Label(box,text="ASSISTPRO · MONITOR AVIATOR",font=("Segoe UI",17,"bold")).pack(anchor="w")
        ttk.Label(box,text="Captura a região escolhida da tela, reconhece multiplicadores e salva no painel.",wraplength=520).pack(anchor="w",pady=(4,14))
        ttk.Label(box,text="Endereço da API").pack(anchor="w")
        ttk.Entry(box,textvariable=self.api).pack(fill="x",pady=(3,12))
        ttk.Button(box,text="1. Selecionar área do jogo",command=self.pick).pack(fill="x")
        ttk.Label(box,textvariable=self.region_label).pack(anchor="w",pady=6)
        row=ttk.Frame(box); row.pack(fill="x",pady=8)
        self.start_btn=ttk.Button(row,text="2. Iniciar monitoramento",command=self.start); self.start_btn.pack(side="left",expand=True,fill="x",padx=(0,5))
        self.stop_btn=ttk.Button(row,text="Parar",command=self.stop,state="disabled"); self.stop_btn.pack(side="left",expand=True,fill="x",padx=(5,0))
        ttk.Label(box,text="Resultados detectados",font=("Segoe UI",11,"bold")).pack(anchor="w",pady=(12,3))
        self.log=tk.Listbox(box,height=9); self.log.pack(fill="both",expand=True)
        ttk.Label(box,textvariable=self.status,wraplength=520).pack(anchor="w",pady=(8,0))
        ttk.Label(box,text="A leitura depende de o multiplicador estar visível e legível. Estatísticas não preveem rodadas futuras.",wraplength=520).pack(anchor="w",pady=(8,0))
        root.protocol("WM_DELETE_WINDOW",self.close); root.after(200,self.poll)
    def pick(self):
        self.root.withdraw(); self.root.after(250,lambda:RegionPicker(self.root,self.set_region))
    def set_region(self,r):
        self.region=r; self.region_label.set(f"Área selecionada: {r['width']} × {r['height']} px"); self.root.deiconify()
    def start(self):
        if not self.region: messagebox.showwarning("Área necessária","Selecione primeiro a área do multiplicador."); return
        if not self.api.get().strip().startswith("http"): messagebox.showerror("API inválida","Informe o endereço completo da API."); return
        self.running=True; self.start_btn.configure(state="disabled"); self.stop_btn.configure(state="normal")
        self.status.set("Monitorando a tela. Deixe o jogo visível."); self.worker=threading.Thread(target=self.loop,daemon=True); self.worker.start()
    def stop(self):
        self.running=False; self.start_btn.configure(state="normal"); self.stop_btn.configure(state="disabled"); self.status.set("Monitoramento pausado.")
    def loop(self):
        while self.running:
            try:
                with mss.mss() as sct: frame=np.array(sct.grab(self.region))[:,:,:3]
                result,_=self.ocr(frame)
                texts=[str(item[1]) for item in (result or [])]
                joined=" ".join(texts).replace(",",".")
                matches=re.findall(r"(?<![0-9])([0-9]{1,6}(?:\.[0-9]{1,2})?)\s*[xX×]",joined)
                if not matches:
                    matches=re.findall(r"([0-9]{1,6}(?:\.[0-9]{1,2})?)\s*[xX×]",joined)
                for raw in matches:
                    value=float(raw)
                    if value<1 or value>1000000: continue
                    now=time.time()
                    if raw in self.last_seen and now-self.last_seen[raw]<12: continue
                    self.last_seen[raw]=now
                    try:
                        resp=requests.post(self.api.get().rstrip("/")+"/api/rounds",json={"multiplier":value,"source":"desktop","occurredAt":datetime.now(timezone.utc).isoformat()},timeout=12)
                        if resp.ok: self.events.put(("ok",value))
                        else: self.events.put(("err",f"API respondeu HTTP {resp.status_code}: {resp.text[:120]}"))
                    except Exception as e: self.events.put(("err",str(e)[:140]))
                time.sleep(1.0)
            except Exception as e:
                self.events.put(("err","Falha na captura/OCR: "+str(e)[:120])); time.sleep(2)
    def poll(self):
        try:
            while True:
                kind,val=self.events.get_nowait()
                if kind=="ok":
                    self.log.insert(0,f"{datetime.now().strftime('%H:%M:%S')}  ·  {val:.2f}x salvo")
                    self.status.set(f"Último multiplicador enviado: {val:.2f}x")
                else: self.status.set(val)
        except queue.Empty: pass
        self.root.after(200,self.poll)
    def close(self): self.stop(); self.root.destroy()
if __name__=="__main__":
    root=tk.Tk(); App(root); root.mainloop()
