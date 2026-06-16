document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("catalogo-container");
    const LOCAL_STORAGE_KEY = "famiq_catalogo_estado";
    let isEditMode = false;
    let hoveredElement = null; // Para rastrear dónde está el mouse al presionar Ctrl+V

    // ==========================================
    // 1. INICIALIZACIÓN Y PERSISTENCIA
    // ==========================================
    function init() {
        const estadoGuardado = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (estadoGuardado) {
            container.innerHTML = estadoGuardado;
        } else {
            if (typeof catalogoData !== 'undefined' && catalogoData.fichas) {
                renderizarCatalogoDesdeData();
            } else {
                console.error("No se encontró catalogoData. Asegúrate de que data.js esté cargado antes que app.js.");
            }
        }
        sincronizarIndice();
        setupEventListeners();
    }

    function guardarEstadoLocal() {
        if (container) {
            localStorage.setItem(LOCAL_STORAGE_KEY, container.innerHTML);
        }
    }

    // ==========================================
    // SINCRONIZAR ÍNDICE
    // ==========================================
    function sincronizarIndice() {
        document.querySelectorAll('.idx-normas').forEach(contenedor => {
            const fichaId = contenedor.getAttribute('data-target');
            const ficha = document.getElementById(fichaId);
            if (!ficha) return;

            let htmlBadges = '';
            const gruposInfo = ficha.querySelectorAll('.ficha__info-grupo');
            let contenedorNormas = null;
            
            gruposInfo.forEach(grupo => {
                const label = grupo.querySelector('.ficha__info-label');
                if (label && label.innerText.toUpperCase().includes('NORMAS APLICABLES')) {
                    contenedorNormas = grupo.querySelector('.ficha__info-val');
                }
            });

            if (contenedorNormas) {
                const nodos = Array.from(contenedorNormas.childNodes);
                let modoActual = ''; 
                let normaMetricaEncontrada = false;
                let normaPulgadasEncontrada = false;

                nodos.forEach(nodo => {
                    if (nodo.nodeType === 1) { 
                        const texto = nodo.innerText.toUpperCase();
                        
                        if (nodo.classList.contains('badge-metrico') || texto.includes('MÉTRICO')) {
                            modoActual = 'M';
                        } else if (nodo.classList.contains('badge-pulgadas') || texto.includes('PULGADAS')) {
                            modoActual = 'P';
                        } 
                        else if (nodo.classList.contains('norma')) {
                            const textoNorma = nodo.innerText.trim();
                            if (modoActual === 'M' && !normaMetricaEncontrada && textoNorma) {
                                htmlBadges += `<span class="subcat-sistema m">M</span><span class="tag-norma">${textoNorma}</span>`;
                                normaMetricaEncontrada = true;
                            } else if (modoActual === 'P' && !normaPulgadasEncontrada && textoNorma) {
                                htmlBadges += `<span class="subcat-sistema p">Pulg</span><span class="tag-norma">${textoNorma}</span>`;
                                normaPulgadasEncontrada = true;
                            }
                        }
                    }
                });
            }

            if (contenedor.innerHTML !== htmlBadges) {
                contenedor.innerHTML = htmlBadges;
            }
        });
    }

    // ==========================================
    // 2. RENDERIZADO DESDE JSON (Plano Único)
    // ==========================================
    function renderizarCatalogoDesdeData() {
        let html = '';
        catalogoData.fichas.forEach(ficha => {
            html += `
            <div class="ficha" id="${ficha.id}">
              <div class="ficha__header">
                <div class="ficha__header-cat">${ficha.categoria}</div>
                <div class="ficha__header-sub">${ficha.subcategoria_num} <span contenteditable="true">${ficha.subcategoria_nombre}</span><small contenteditable="true">${ficha.subcategoria_en}</small></div>
              </div>
              <div class="ficha__body">
                <div class="ficha__plano">
                  <div class="ficha__foto-slot" title="Apunta aquí y presiona Ctrl+V para pegar foto">
                    <div class="ficha__foto-slot-icon edit-only">📷</div>
                    <div class="ficha__foto-slot-txt edit-only">Ctrl+V para pegar foto</div>
                    <img alt="foto producto" style="display:none;" />
                    <button class="btn-reemplazar-svg edit-only btn-foto-manual" style="bottom:auto; top:4px; right:4px;">📂 Cargar archivo</button>
                    <input type="file" accept="image/*" class="foto-file-input" style="display:none;">
                  </div>
                  <div class="ficha__vistas">
                    <div class="ficha__vista" style="width: 100%; border-right: none;" title="Apunta aquí y presiona Ctrl+V para pegar plano">
                        ${ficha.svg_vista1 || ''}
                        <img class="ficha__vista-img-reemplazo" alt="plano personalizado" style="display:none;" />
                        <div class="ficha__vista-label edit-only" style="margin-top: 10px; color:#003DA5;">Apunta aquí y presiona Ctrl+V para pegar plano</div>
                        <button class="btn-reemplazar-svg edit-only">📂 Archivo manual</button>
                        <input type="file" accept="image/*,.svg" class="svg-file-input" style="display:none;">
                    </div>
                  </div>
                </div>
                <div class="ficha__info">
                  <div class="ficha__nombre-es" contenteditable="true">${ficha.nombre_es || ficha.subcategoria_nombre}</div>
                  <div class="ficha__nombre-en-sub" contenteditable="true">${ficha.subcategoria_en}</div>
                  <div class="ficha__divider"></div>
                  
                  <div class="ficha__info-grupo">
                    <div class="ficha__info-label">Normas aplicables</div>
                    <div class="ficha__info-val" contenteditable="true">${ficha.normas_html || ''}</div>
                  </div>
                  
                  <div class="ficha__normas-bloque">
                    ${ficha.normas_bloque || ''}
                  </div>

                  ${ficha.prop_mec_headers ? `
                  <div class="prop-mec">
                    <div class="prop-mec__titulo">Propiedades mecánicas</div>
                    <table>
                        <thead>${ficha.prop_mec_headers}</thead>
                        <tbody>${ficha.prop_mec_body}</tbody>
                    </table>
                  </div>` : ''}

                  <div class="ficha__info-grupo">
                    <div class="ficha__info-label">Materiales disponibles</div>
                    <div class="ficha__info-val" contenteditable="true">${ficha.materiales || ''}</div>
                  </div>
                  <div class="ficha__info-grupo">
                    <div class="ficha__info-label">Descripción</div>
                    <div class="ficha__desc" contenteditable="true">${ficha.descripcion || ''}</div>
                  </div>
                  <div class="ficha__info-grupo">
                    <div class="ficha__info-label">Aplicaciones típicas</div>
                    <div class="ficha__apps">${ficha.aplicaciones || ''}</div>
                  </div>
                  <div class="ficha__info-grupo" style="margin-top:auto;">
                    <div class="ficha__info-label">Presentación</div>
                    <div class="ficha__info-val" contenteditable="true">${ficha.presentacion || ''}</div>
                  </div>
                </div>
              </div>
              <div class="ficha__tabla-wrap">
                <div class="ficha__tabla-titulo">Tabla de cotas y dimensiones</div>
                <div class="tabla-edit-bar edit-only-flex">
                    <button class="btn-pegar-excel" style="background:#e8eef8; color:#003DA5; border:1px solid #b0c4e8; border-radius:4px; padding:6px 12px; font-family:inherit; font-size:12px; font-weight:600; cursor:pointer;">📋 Cargar tabla desde Excel</button>
                </div>
                <table class="cotas">
                    <thead>${ficha.tabla_headers || ''}</thead>
                    <tbody>${ficha.tabla_body || ''}</tbody>
                </table>
              </div>
              <div class="ficha__pie">
                <span class="ficha__pie-nota" contenteditable="true">Datos orientativos. Confirmar disponibilidad con equipo técnico · famiq.com.ar</span>
                <span class="ficha__pie-pag">${ficha.pie_pagina || ''}</span>
                <button class="btn-exportar-ficha edit-only" data-id="${ficha.id}">⬇ Exportar esta ficha</button>
              </div>
            </div>`;
        });
        container.innerHTML = html;
        guardarEstadoLocal();
    }

    // ==========================================
    // 3. HOVER Y PEGAR IMÁGENES (Ctrl+V)
    // ==========================================
    
    // Rastrear la posición del mouse
    document.addEventListener("mouseover", (e) => {
        hoveredElement = e.target;
    });

    // Interceptar pegado del portapapeles
    document.addEventListener("paste", (e) => {
        if (!isEditMode || !hoveredElement) return;

        const vistaPlano = hoveredElement.closest('.ficha__vista');
        const fotoSlot = hoveredElement.closest('.ficha__foto-slot');

        if (vistaPlano || fotoSlot) {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1) {
                    e.preventDefault(); // Evitar que se pegue como texto si está en focus
                    const blob = items[i].getAsFile();
                    const reader = new FileReader();
                    
                    reader.onload = (ev) => {
                        if (vistaPlano) {
                            const imgReemplazo = vistaPlano.querySelector(".ficha__vista-img-reemplazo");
                            imgReemplazo.src = ev.target.result;
                            imgReemplazo.style.display = "block";
                            vistaPlano.classList.add("tiene-imagen");
                            const svgOriginal = vistaPlano.querySelector("svg");
                            if (svgOriginal) svgOriginal.style.display = "none";
                        } else if (fotoSlot) {
                            const img = fotoSlot.querySelector("img");
                            img.src = ev.target.result;
                            img.style.display = "block";
                            fotoSlot.classList.add("tiene-foto");
                        }
                        guardarEstadoLocal();
                    };
                    reader.readAsDataURL(blob);
                    break;
                }
            }
        }
    });

    // ==========================================
    // 4. EVENT DELEGATION (Clics globales)
    // ==========================================
    document.addEventListener("click", (e) => {
        // Navegación del Índice
        const link = e.target.closest('a[href^="#"]');
        if (link) {
            e.preventDefault();
            const targetId = link.getAttribute("href").substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) targetElement.scrollIntoView({ behavior: "smooth" });
            return;
        }

        // Modo Edición
        if (e.target.matches("#btn-toggle-edit") || e.target.matches("#btn-exit-edit")) {
            isEditMode = !isEditMode;
            document.body.classList.toggle("edit-mode", isEditMode);
            const btnFloat = document.getElementById("btn-toggle-edit");
            if (btnFloat) {
                btnFloat.innerHTML = isEditMode ? '✕ Salir de edición' : '✏️ Editar contenido';
                btnFloat.style.background = isEditMode ? '#C8102E' : '#1a1a1a';
            }
        }

        // Cargar Tabla Excel (TSV)
        if (e.target.matches(".btn-pegar-excel")) {
            const wrap = e.target.closest(".ficha__tabla-wrap");
            const tabla = wrap.querySelector("table.cotas");
            
            if (wrap.querySelector('.excel-paste-area')) return;

            const pasteArea = document.createElement("div");
            pasteArea.className = "excel-paste-area";
            pasteArea.innerHTML = `
                <textarea placeholder="Copia el rango en Excel y pega aquí con Ctrl+V..." style="width:100%; height:120px; font-family:monospace; font-size:12px; padding:10px; border:1.5px dashed #003DA5; border-radius:4px; margin-bottom:5px; resize:vertical; background: rgba(0,61,165,0.03); outline:none;"></textarea>
                <div style="text-align:right; margin-bottom:10px;">
                    <button class="btn-cancelar-paste" style="background:#f5f5f5; border:1px solid #ddd; padding:6px 12px; border-radius:4px; margin-right:5px; font-family:inherit; cursor:pointer;">Cancelar</button>
                    <button class="btn-aplicar-paste" style="background:#003DA5; color:white; border:none; padding:6px 12px; border-radius:4px; font-family:inherit; cursor:pointer; font-weight:600;">Aplicar Datos</button>
                </div>
            `;
            
            tabla.style.display = "none";
            e.target.style.display = "none";
            wrap.insertBefore(pasteArea, tabla);

            const textarea = pasteArea.querySelector("textarea");
            textarea.focus();

            pasteArea.querySelector(".btn-cancelar-paste").addEventListener("click", () => {
                pasteArea.remove();
                tabla.style.display = "table";
                e.target.style.display = "block";
            });

            pasteArea.querySelector(".btn-aplicar-paste").addEventListener("click", () => {
                const rawData = textarea.value.trim();
                if (!rawData) { alert("No detectaron datos."); return; }

                const rows = rawData.split('\n').map(r => r.split('\t').map(c => c.trim().replace(/\r/g, '')));
                if (rows.length > 0) {
                    let newHtml = '<thead><tr>';
                    rows[0].forEach((header, i) => {
                        const align = i === 0 ? 'style="text-align:left;padding-left:3mm;"' : '';
                        newHtml += `<th ${align}>${header}</th>`;
                    });
                    newHtml += '</tr></thead><tbody>';

                    for (let i = 1; i < rows.length; i++) {
                        const row = rows[i];
                        const isSep = /^[\u{1F7E2}\u{1F7E0}\u{1F535}]/u.test(row[0]) || row[0].toUpperCase().includes("SERIE");
                        if (isSep) {
                            const c1 = Math.ceil(row.length * 0.6);
                            const c2 = row.length - c1;
                            const resto = row.slice(1).filter(c => c).join(' · ');
                            newHtml += `<tr class="serie-sep"><td colspan="${c1}" contenteditable="true">${row[0]}</td><td colspan="${c2}" style="text-align:right;padding-right:3mm;opacity:0.8;" contenteditable="true">${resto}</td></tr>`;
                        } else {
                            newHtml += '<tr>';
                            row.forEach((cell, idx) => {
                                const align = idx === 0 ? 'style="text-align:left;padding-left:3mm;"' : '';
                                newHtml += `<td ${align} contenteditable="true">${cell}</td>`;
                            });
                            newHtml += '</tr>';
                        }
                    }
                    newHtml += '</tbody>';
                    tabla.innerHTML = newHtml;
                }
                pasteArea.remove();
                tabla.style.display = "table";
                e.target.style.display = "block";
                guardarEstadoLocal();
            });
        }

        // Carga manual de imágenes (Input type file)
        if (e.target.matches(".btn-foto-manual")) {
            e.target.closest(".ficha__foto-slot").querySelector(".foto-file-input").click();
        }
        if (e.target.matches(".btn-reemplazar-svg")) {
            e.target.closest(".ficha__vista").querySelector(".svg-file-input").click();
        }

        // Exportar Ficha Individual
        if (e.target.matches(".btn-exportar-ficha")) {
            const fichaId = e.target.getAttribute("data-id");
            const ficha = document.getElementById(fichaId);
            if (!ficha) return;
            
            document.body.classList.remove("edit-mode");
            document.querySelectorAll('.ficha').forEach(f => f.classList.remove('imprimiendo'));
            ficha.classList.add("imprimiendo");
            
            setTimeout(() => {
                window.print();
                ficha.classList.remove("imprimiendo");
                if (isEditMode) document.body.classList.add("edit-mode");
            }, 150);
        }
    });

    // ==========================================
    // 5. CARGA DE IMÁGENES (File API manual)
    // ==========================================
    document.addEventListener("change", (e) => {
        if (e.target.matches(".foto-file-input")) {
            const file = e.target.files[0];
            if (!file) return;
            const slot = e.target.closest(".ficha__foto-slot");
            const img = slot.querySelector("img");
            const reader = new FileReader();
            reader.onload = (ev) => {
                img.src = ev.target.result;
                img.style.display = "block";
                slot.classList.add("tiene-foto");
                guardarEstadoLocal();
            };
            reader.readAsDataURL(file);
        }

        if (e.target.matches(".svg-file-input")) {
            const file = e.target.files[0];
            if (!file) return;
            const vista = e.target.closest(".ficha__vista");
            const imgReemplazo = vista.querySelector(".ficha__vista-img-reemplazo");
            const reader = new FileReader();
            reader.onload = (ev) => {
                imgReemplazo.src = ev.target.result;
                imgReemplazo.style.display = "block";
                vista.classList.add("tiene-imagen");
                const svgOriginal = vista.querySelector("svg");
                if (svgOriginal) svgOriginal.style.display = "none";
                guardarEstadoLocal();
            };
            reader.readAsDataURL(file);
        }
    });

    // ==========================================
    // 6. RASTREO DE EDICIÓN DE TEXTO
    // ==========================================
    document.addEventListener("input", (e) => {
        if (e.target.hasAttribute("contenteditable")) {
            if (e.target.classList.contains("ficha__normas-cell-val") || 
                e.target.classList.contains("ficha__info-val") ||
                e.target.closest(".ficha__info-val")) {
                sincronizarIndice();
            }
            guardarEstadoLocal();
        }
    });

    function setupEventListeners() {
        const btnReset = document.getElementById("btn-reset-state");
        if (btnReset) {
            btnReset.addEventListener("click", () => {
                if(confirm("¿Restaurar el catálogo a su estado base original? Se perderán las ediciones no guardadas.")){
                    localStorage.removeItem(LOCAL_STORAGE_KEY);
                    if (typeof catalogoData !== 'undefined' && catalogoData.fichas) {
                        renderizarCatalogoDesdeData();
                        sincronizarIndice();
                    }
                }
            });
        }
    }

    init();
});