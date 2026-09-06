// ======================================================
// CeroHambre - App.js
// ======================================================

const API = "http://localhost:3000/api";


// ======================================================
// USUARIO
// ======================================================

function obtenerUsuario() {

    const usuarioGuardado =
        localStorage.getItem("usuarioCeroHambre");

    if (!usuarioGuardado) {
        return null;
    }

    try {

        return JSON.parse(usuarioGuardado);

    } catch (error) {

        console.error(
            "Error al leer el usuario:",
            error
        );

        return null;
    }
}


// ======================================================
// MOSTRAR USUARIO
// ======================================================

function mostrarUsuario() {

    const usuario =
        obtenerUsuario();

    const nombreUsuario =
        document.getElementById("nombreUsuario");

    if (nombreUsuario && usuario) {

        nombreUsuario.textContent =
            usuario.nombre;
    }
}

mostrarUsuario();


// ======================================================
// CERRAR SESIÓN
// ======================================================

function cerrarSesion() {

    localStorage.removeItem(
        "usuarioCeroHambre"
    );

    window.location.href =
        "login.html";
}


// ======================================================
// NAVEGACIÓN
// ======================================================

// Ir al inicio
function irInicio() {
    window.location.href = "index.html";
}

// Ir a iniciar sesión
function mostrarLogin() {
    window.location.href = "login.html";
}

// Ir a crear una cuenta
function mostrarRegistro() {
    window.location.href = "registro.html";
}

// Ir a la sección "Cómo funciona"
function irComoFunciona() {
    const seccion = document.getElementById("como-funciona");

    if (seccion) {
        seccion.scrollIntoView({
            behavior: "smooth"
        });
    } else {
        window.location.href = "index.html#como-funciona";
    }
}

// Ir a donaciones
function irDonaciones() {
    window.location.href = "donaciones.html";
}

// Ir a solicitudes
function irSolicitudes() {
    window.location.href = "solicitudes.html";
}

// Ir a entregas
function irEntregas() {
    window.location.href = "entregas.html";
}

// Ir a reportes
function irReportes() {
    window.location.href = "reportes.html";
}

// ======================================================
// MODAL PROFESIONAL DE CEROHAMBRE
// ======================================================

function mostrarModal(
    titulo,
    mensaje,
    icono,
    accionConfirmar = null,
    tipo = "confirmacion",
    textoConfirmar = "Aceptar"
) {

    // ------------------------------------------
    // Eliminar modal anterior
    // ------------------------------------------

    const modalAnterior =
        document.getElementById(
            "modalCeroHambre"
        );

    if (modalAnterior) {

        modalAnterior.remove();
    }


    // ------------------------------------------
    // Crear modal
    // ------------------------------------------

    const modal =
        document.createElement("div");

    modal.id =
        "modalCeroHambre";


    // ------------------------------------------
    // Contenido
    // ------------------------------------------

    modal.innerHTML = `

        <div class="modal-overlay">

            <div class="modal-card">

                <div class="modal-icono">
                    ${icono}
                </div>

                <h2>
                    ${titulo}
                </h2>

                <p>
                    ${mensaje}
                </p>

                ${
                    tipo === "exito"
                    ? ""

                    : `

                        <div class="modal-botones">

                            <button
                                type="button"
                                class="modal-cancelar"
                                id="modalCancelar"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                class="modal-confirmar"
                                id="modalConfirmar"
                            >
                                ${textoConfirmar}
                            </button>

                        </div>

                    `
                }

            </div>

        </div>

    `;


    // ------------------------------------------
    // Mostrar modal
    // ------------------------------------------

    document.body.appendChild(
        modal
    );


    // ------------------------------------------
    // Botones
    // ------------------------------------------

    const cancelar =
        document.getElementById(
            "modalCancelar"
        );

    const confirmar =
        document.getElementById(
            "modalConfirmar"
        );


    // ------------------------------------------
    // Cancelar
    // ------------------------------------------

    if (cancelar) {

        cancelar.onclick =
            function() {

                modal.remove();

            };
    }


    // ------------------------------------------
    // Confirmar
    // ------------------------------------------

    if (confirmar) {

        confirmar.onclick =
            function() {

                modal.remove();

                if (
                    accionConfirmar
                ) {

                    accionConfirmar();

                }

            };
    }
}


// ======================================================
// MODAL PARA INGRESAR CANTIDAD
// ======================================================

function mostrarModalCantidad(
    donacionId
) {

    const modalAnterior =
        document.getElementById(
            "modalCeroHambre"
        );

    if (modalAnterior) {

        modalAnterior.remove();
    }


    const modal =
        document.createElement("div");

    modal.id =
        "modalCeroHambre";


    modal.innerHTML = `

        <div class="modal-overlay">

            <div class="modal-card modal-cantidad">

                <div class="modal-icono">
                    🍎
                </div>

                <h2>
                    Solicitar alimentos
                </h2>

                <p>
                    Indica la cantidad que deseas solicitar.
                </p>

                <div class="modal-campo">

                    <label
                        for="cantidadSolicitud"
                    >
                        Cantidad solicitada
                    </label>

                    <input
                        type="number"
                        id="cantidadSolicitud"
                        min="0.01"
                        step="0.01"
                        placeholder="Ej. 20"
                    >

                </div>

                <div
                    id="errorCantidadSolicitud"
                    class="modal-error"
                ></div>

                <div class="modal-botones">

                    <button
                        type="button"
                        class="modal-cancelar"
                        id="modalCancelar"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        class="modal-confirmar"
                        id="modalConfirmar"
                    >
                        Enviar solicitud
                    </button>

                </div>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    const cancelar =
        document.getElementById(
            "modalCancelar"
        );

    const confirmar =
        document.getElementById(
            "modalConfirmar"
        );

    const cantidadInput =
        document.getElementById(
            "cantidadSolicitud"
        );

    const errorCantidad =
        document.getElementById(
            "errorCantidadSolicitud"
        );


    // ------------------------------------------
    // Cancelar
    // ------------------------------------------

    if (cancelar) {

        cancelar.onclick =
            function() {

                modal.remove();

            };
    }


    // ------------------------------------------
    // Confirmar
    // ------------------------------------------

    if (confirmar) {

        confirmar.onclick =
            async function() {

                const cantidad =
                    Number(
                        cantidadInput.value
                    );


                if (
                    !cantidad ||
                    cantidad <= 0
                ) {

                    errorCantidad.textContent =
                        "Ingresa una cantidad válida.";

                    cantidadInput.focus();

                    return;
                }


                confirmar.disabled =
                    true;

                confirmar.textContent =
                    "Enviando...";


                try {

                    const usuario =
                        obtenerUsuario();


                    if (!usuario) {

                        modal.remove();

                        mostrarModal(
                            "Sesión requerida",
                            "Debes iniciar sesión para solicitar alimentos.",
                            "🔐",
                            function() {

                                window.location.href =
                                    "login.html";

                            },
                            "confirmacion",
                            "Iniciar sesión"
                        );

                        return;
                    }


                    const respuesta =
                        await fetch(
                            `${API}/solicitudes`,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body: JSON.stringify({

                                    donacion_id:
                                        donacionId,

                                    organizacion_id:
                                        usuario.id,

                                    cantidad_solicitada:
                                        cantidad

                                })
                            }
                        );


                    const datos =
                        await respuesta.json();


                    if (!respuesta.ok) {

                        confirmar.disabled =
                            false;

                        confirmar.textContent =
                            "Enviar solicitud";

                        errorCantidad.textContent =
                            datos.mensaje ||
                            "No se pudo realizar la solicitud.";

                        return;
                    }


                    // ----------------------------------
                    // Cerrar modal de cantidad
                    // ----------------------------------

                    modal.remove();


                    // ----------------------------------
                    // Mensaje de éxito
                    // ----------------------------------

                    mostrarModal(
                        "Solicitud enviada",
                        "Tu solicitud de alimentos fue registrada correctamente.",
                        "✓",
                        null,
                        "exito"
                    );


                    // ----------------------------------
                    // Actualizar después del mensaje
                    // ----------------------------------

                    setTimeout(
                        function() {

                            const modalExito =
                                document.getElementById(
                                    "modalCeroHambre"
                                );

                            if (modalExito) {

                                modalExito.remove();

                            }

                            cargarDonaciones();

                        },
                        1200
                    );


                } catch (error) {

                    console.error(error);

                    confirmar.disabled =
                        false;

                    confirmar.textContent =
                        "Enviar solicitud";

                    errorCantidad.textContent =
                        "No se pudo conectar con el servidor.";
                }
            };
    }


    // ------------------------------------------
    // Enter para enviar
    // ------------------------------------------

    if (cantidadInput) {

        cantidadInput.addEventListener(
            "keydown",
            function(event) {

                if (
                    event.key === "Enter"
                ) {

                    confirmar.click();

                }

            }
        );

        cantidadInput.focus();
    }
}


// ======================================================
// LOGIN
// ======================================================

const loginForm =
    document.getElementById(
        "loginForm"
    );

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const correo =
                document
                    .getElementById("correo")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            const mensaje =
                document.getElementById(
                    "mensajeLogin"
                );


            if (
                !correo ||
                !password
            ) {

                mensaje.textContent =
                    "Completa todos los campos.";

                return;
            }


            try {

                const respuesta =
                    await fetch(
                        `${API}/usuarios/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                correo:
                                    correo,

                                password:
                                    password

                            })
                        }
                    );


                const datos =
                    await respuesta.json();


                if (!respuesta.ok) {

                    mensaje.textContent =
                        datos.mensaje ||
                        "Correo o contraseña incorrectos.";

                    return;
                }


                localStorage.setItem(
                    "usuarioCeroHambre",
                    JSON.stringify(
                        datos.usuario
                    )
                );


                mensaje.textContent =
                    "¡Inicio de sesión exitoso!";


                setTimeout(
                    function() {

                        window.location.href =
                            "dashboard.html";

                    },
                    1000
                );


            } catch (error) {

                console.error(error);

                mensaje.textContent =
                    "No se pudo conectar con el servidor.";
            }
        }
    );
}


// ======================================================
// REGISTRO
// ======================================================

const registroForm =
    document.getElementById(
        "registroForm"
    );

if (registroForm) {

    registroForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const nombre =
                document
                    .getElementById("nombre")
                    .value
                    .trim();


            const correo =
                document
                    .getElementById(
                        "correoRegistro"
                    )
                    .value
                    .trim();


            const password =
                document
                    .getElementById(
                        "passwordRegistro"
                    )
                    .value;


            const tipo_usuario =
                document.getElementById(
                    "tipo_usuario"
                ).value;


            const ubicacion =
                document
                    .getElementById(
                        "ubicacion"
                    )
                    .value
                    .trim();


            const mensaje =
                document.getElementById(
                    "mensajeRegistro"
                );


            if (
                !nombre ||
                !correo ||
                !password ||
                !tipo_usuario ||
                !ubicacion
            ) {

                mensaje.textContent =
                    "Completa todos los campos obligatorios.";

                return;
            }


            try {

                const respuesta =
                    await fetch(
                        `${API}/usuarios`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                nombre:
                                    nombre,

                                correo:
                                    correo,

                                password:
                                    password,

                                tipo_usuario:
                                    tipo_usuario,

                                ubicacion:
                                    ubicacion

                            })
                        }
                    );


                const datos =
                    await respuesta.json();


                if (!respuesta.ok) {

                    mensaje.textContent =
                        datos.mensaje ||
                        "No se pudo crear la cuenta.";

                    return;
                }


                mensaje.textContent =
                    "¡Cuenta creada correctamente!";


                registroForm.reset();


                setTimeout(
                    function() {

                        window.location.href =
                            "login.html";

                    },
                    1500
                );


            } catch (error) {

                console.error(error);

                mensaje.textContent =
                    "No se pudo conectar con el servidor.";
            }
        }
    );
}


// ======================================================
// PUBLICAR DONACIÓN
// ======================================================

const donacionForm =
    document.getElementById(
        "donacionForm"
    );

if (donacionForm) {

    donacionForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const usuario =
                obtenerUsuario();


            if (!usuario) {

                mostrarModal(
                    "Sesión requerida",
                    "Debes iniciar sesión para publicar una donación.",
                    "🔐",
                    function() {

                        window.location.href =
                            "login.html";

                    },
                    "confirmacion",
                    "Iniciar sesión"
                );

                return;
            }


            const alimento =
                document
                    .getElementById(
                        "alimento"
                    )
                    .value
                    .trim();


            const cantidad =
                document.getElementById(
                    "cantidad"
                ).value;


            const unidad =
                document.getElementById(
                    "unidad"
                ).value;


            const fecha_vencimiento =
                document.getElementById(
                    "fecha_vencimiento"
                ).value;


            const ubicacion =
                document
                    .getElementById(
                        "ubicacion"
                    )
                    .value
                    .trim();


            const descripcion =
                document
                    .getElementById(
                        "descripcion"
                    )
                    .value
                    .trim();


            const mensaje =
                document.getElementById(
                    "mensajeDonacion"
                );


            if (
                !alimento ||
                !cantidad ||
                !unidad ||
                !fecha_vencimiento ||
                !ubicacion
            ) {

                mensaje.textContent =
                    "Por favor completa todos los campos obligatorios.";

                return;
            }


            try {

                const respuesta =
                    await fetch(
                        `${API}/donaciones`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                usuario_id:
                                    usuario.id,

                                alimento:
                                    alimento,

                                cantidad:
                                    Number(cantidad),

                                unidad:
                                    unidad,

                                fecha_vencimiento:
                                    fecha_vencimiento,

                                ubicacion:
                                    ubicacion,

                                descripcion:
                                    descripcion

                            })
                        }
                    );


                const datos =
                    await respuesta.json();


                if (!respuesta.ok) {

                    mensaje.textContent =
                        datos.mensaje ||
                        "No se pudo publicar la donación.";

                    return;
                }


                mensaje.textContent =
                    "¡Donación publicada correctamente!";


                donacionForm.reset();


                setTimeout(
                    function() {

                        window.location.href =
                            "donaciones.html";

                    },
                    1500
                );


            } catch (error) {

                console.error(error);

                mensaje.textContent =
                    "No se pudo conectar con el servidor.";
            }
        }
    );
}


// ======================================================
// CARGAR DONACIONES
// ======================================================

const listaDonaciones =
    document.getElementById(
        "listaDonaciones"
    );

if (listaDonaciones) {

    cargarDonaciones();
}


async function cargarDonaciones() {

    try {

        const respuesta =
            await fetch(
                `${API}/donaciones`
            );


        const donaciones =
            await respuesta.json();


        if (!respuesta.ok) {

            listaDonaciones.innerHTML = `

                <div class="actividad-card">

                    <div class="actividad-vacia">

                        <div class="actividad-icono">
                            ⚠️
                        </div>

                        <h3>
                            Error al cargar donaciones
                        </h3>

                    </div>

                </div>

            `;

            return;
        }


        if (
            donaciones.length === 0
        ) {

            listaDonaciones.innerHTML = `

                <div class="actividad-card">

                    <div class="actividad-vacia">

                        <div class="actividad-icono">
                            🍎
                        </div>

                        <h3>
                            No hay donaciones disponibles
                        </h3>

                        <p>
                            Cuando se publiquen alimentos,
                            aparecerán aquí.
                        </p>

                    </div>

                </div>

            `;

            return;
        }


        listaDonaciones.innerHTML =
            "";


        const usuario =
            obtenerUsuario();


        donaciones.forEach(
            function(donacion) {


                // ----------------------------------
                // Solo organizaciones pueden solicitar
                // ----------------------------------

                const puedeSolicitar =
                    usuario &&
                    usuario.tipo_usuario ===
                        "organizacion" &&
                    donacion.estado ===
                        "disponible";


                listaDonaciones.innerHTML += `

                    <div class="donacion-card">

                        <div class="donacion-icono">
                            🍎
                        </div>

                        <div class="donacion-info">

                            <h3>
                                ${donacion.alimento}
                            </h3>

                            <p>
                                <strong>
                                    Cantidad:
                                </strong>

                                ${donacion.cantidad}
                                ${donacion.unidad}
                            </p>

                            <p>
                                <strong>
                                    Ubicación:
                                </strong>

                                ${donacion.ubicacion}
                            </p>

                            <p>
                                <strong>
                                    Vencimiento:
                                </strong>

                                ${donacion.fecha_vencimiento}
                            </p>

                            <p>
                                <strong>
                                    Donante:
                                </strong>

                                ${donacion.donante}
                            </p>

                            ${
                                donacion.descripcion
                                ? `

                                    <p>
                                        ${donacion.descripcion}
                                    </p>

                                `
                                : ""
                            }

                        </div>

                        <div class="donacion-acciones">

                            <div class="donacion-estado">
                                ${donacion.estado}
                            </div>

                            ${
                                puedeSolicitar
                                ? `

                                    <button
                                        class="btn-solicitar"
                                        onclick="
                                            solicitarDonacion(
                                                ${donacion.id}
                                            )
                                        "
                                    >
                                        Solicitar
                                    </button>

                                `
                                : ""
                            }

                        </div>

                    </div>

                `;
            }
        );


    } catch (error) {

        console.error(error);


        listaDonaciones.innerHTML = `

            <div class="actividad-card">

                <div class="actividad-vacia">

                    <div class="actividad-icono">
                        ⚠️
                    </div>

                    <h3>
                        Error de conexión
                    </h3>

                    <p>
                        No se pudo conectar con el servidor.
                    </p>

                </div>

            </div>

        `;
    }
}


// ======================================================
// SOLICITAR DONACIÓN
// ======================================================

async function solicitarDonacion(
    donacionId
) {

    const usuario =
        obtenerUsuario();


    if (!usuario) {

        mostrarModal(
            "Iniciar sesión",
            "Debes iniciar sesión para solicitar alimentos.",
            "🔐",
            function() {

                window.location.href =
                    "login.html";

            },
            "confirmacion",
            "Iniciar sesión"
        );

        return;
    }


    if (
        usuario.tipo_usuario !==
        "organizacion"
    ) {

        mostrarModal(
            "Acción no disponible",
            "Las donaciones pueden ser solicitadas únicamente por organizaciones.",
            "🏢",
            null,
            "exito"
        );

        return;
    }


    mostrarModalCantidad(
        donacionId
    );
}


// ======================================================
// CARGAR SOLICITUDES
// ======================================================

const listaSolicitudes =
    document.getElementById(
        "listaSolicitudes"
    );

if (listaSolicitudes) {

    cargarSolicitudes();
}


async function cargarSolicitudes() {

    try {

        const usuario =
            obtenerUsuario();


        const respuesta =
            await fetch(
                `${API}/solicitudes`
            );


        const solicitudes =
            await respuesta.json();


        if (!respuesta.ok) {

            listaSolicitudes.innerHTML = `

                <div class="actividad-card">

                    <div class="actividad-vacia">

                        <div class="actividad-icono">
                            ⚠️
                        </div>

                        <h3>
                            Error al cargar solicitudes
                        </h3>

                    </div>

                </div>

            `;

            return;
        }


        if (
            solicitudes.length === 0
        ) {

            listaSolicitudes.innerHTML = `

                <div class="actividad-card">

                    <div class="actividad-vacia">

                        <div class="actividad-icono">
                            📋
                        </div>

                        <h3>
                            No hay solicitudes
                        </h3>

                        <p>
                            Las solicitudes aparecerán aquí
                            cuando una organización solicite
                            una donación.
                        </p>

                    </div>

                </div>

            `;

            return;
        }


        listaSolicitudes.innerHTML =
            "";


        solicitudes.forEach(
            function(solicitud) {

                let acciones =
                    "";


                // ----------------------------------
                // ACCIONES DEL DONANTE
                // ----------------------------------

                if (
                    usuario &&
                    usuario.tipo_usuario ===
                        "donante"
                ) {


                    if (
                        solicitud.estado ===
                        "pendiente"
                    ) {

                        acciones = `

                            <button
                                class="btn-solicitar"
                                onclick="
                                    aceptarSolicitud(
                                        ${solicitud.id}
                                    )
                                "
                            >
                                Aceptar
                            </button>

                            <button
                                class="btn-rechazar"
                                onclick="
                                    rechazarSolicitud(
                                        ${solicitud.id}
                                    )
                                "
                            >
                                Rechazar
                            </button>

                        `;

                    }


                    else if (
                        solicitud.estado ===
                        "aceptada"
                    ) {

                        acciones = `

                            <button
                                class="btn-solicitar"
                                onclick="
                                    registrarEntrega(
                                        ${solicitud.id}
                                    )
                                "
                            >
                                Registrar entrega
                            </button>

                        `;
                    }
                }


                listaSolicitudes.innerHTML += `

                    <div class="donacion-card">

                        <div class="donacion-icono">
                            📋
                        </div>

                        <div class="donacion-info">

                            <h3>
                                Solicitud #${solicitud.id}
                            </h3>

                            <p>
                                <strong>
                                    Donación:
                                </strong>

                                #${solicitud.donacion_id}
                            </p>

                            <p>
                                <strong>
                                    Organización:
                                </strong>

                                ${solicitud.organizacion}
                            </p>

                            <p>
                                <strong>
                                    Cantidad solicitada:
                                </strong>

                                ${solicitud.cantidad_solicitada}
                            </p>

                            <p>
                                <strong>
                                    Estado:
                                </strong>

                                ${solicitud.estado}
                            </p>

                        </div>

                        <div class="donacion-acciones">

                            <div class="donacion-estado">
                                ${solicitud.estado}
                            </div>

                            ${acciones}

                        </div>

                    </div>

                `;
            }
        );


    } catch (error) {

        console.error(error);


        listaSolicitudes.innerHTML = `

            <div class="actividad-card">

                <div class="actividad-vacia">

                    <div class="actividad-icono">
                        ⚠️
                    </div>

                    <h3>
                        Error de conexión
                    </h3>

                    <p>
                        No se pudo conectar con el servidor.
                    </p>

                </div>

            </div>

        `;
    }
}


// ======================================================
// ACEPTAR SOLICITUD
// ======================================================

async function aceptarSolicitud(
    id
) {

    const usuario =
        obtenerUsuario();


    if (!usuario) {

        mostrarModal(
            "Sesión requerida",
            "Debes iniciar sesión para realizar esta acción.",
            "🔐",
            function() {

                window.location.href =
                    "login.html";

            },
            "confirmacion",
            "Iniciar sesión"
        );

        return;
    }


    if (
        usuario.tipo_usuario !==
        "donante"
    ) {

        mostrarModal(
            "Acción no permitida",
            "Solo el donante puede aceptar esta solicitud.",
            "⚠️",
            null,
            "exito"
        );

        return;
    }


    mostrarModal(
        "Aceptar solicitud",
        "¿Deseas aceptar esta solicitud de alimentos?",
        "✓",

        async function() {

            try {

                const respuesta =
                    await fetch(
                        `${API}/solicitudes/${id}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                estado:
                                    "aceptada",

                                usuario_id:
                                    usuario.id

                            })
                        }
                    );


                const datos =
                    await respuesta.json();


                if (!respuesta.ok) {

                    mostrarModal(
                        "No se pudo aceptar",
                        datos.mensaje ||
                            "No se pudo aceptar la solicitud.",
                        "⚠️",
                        null,
                        "exito"
                    );

                    return;
                }


                mostrarModal(
                    "Solicitud aceptada",
                    "La solicitud fue aceptada correctamente.",
                    "✓",
                    null,
                    "exito"
                );


                setTimeout(
                    function() {

                        const modal =
                            document.getElementById(
                                "modalCeroHambre"
                            );

                        if (modal) {

                            modal.remove();

                        }

                        cargarSolicitudes();

                    },
                    1000
                );


            } catch (error) {

                console.error(error);


                mostrarModal(
                    "Error de conexión",
                    "No se pudo conectar con el servidor.",
                    "⚠️",
                    null,
                    "exito"
                );
            }
        },

        "confirmacion",

        "Aceptar solicitud"
    );
}


// ======================================================
// RECHAZAR SOLICITUD
// ======================================================

async function rechazarSolicitud(
    id
) {

    const usuario =
        obtenerUsuario();


    if (!usuario) {

        mostrarModal(
            "Sesión requerida",
            "Debes iniciar sesión para realizar esta acción.",
            "🔐",
            function() {

                window.location.href =
                    "login.html";

            },
            "confirmacion",
            "Iniciar sesión"
        );

        return;
    }


    if (
        usuario.tipo_usuario !==
        "donante"
    ) {

        mostrarModal(
            "Acción no permitida",
            "Solo el donante puede rechazar esta solicitud.",
            "⚠️",
            null,
            "exito"
        );

        return;
    }


    mostrarModal(
        "Rechazar solicitud",
        "¿Estás seguro de rechazar esta solicitud?",
        "⚠️",

        async function() {

            try {

                const respuesta =
                    await fetch(
                        `${API}/solicitudes/${id}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                estado:
                                    "rechazada",

                                usuario_id:
                                    usuario.id

                            })
                        }
                    );


                const datos =
                    await respuesta.json();


                if (!respuesta.ok) {

                    mostrarModal(
                        "No se pudo rechazar",
                        datos.mensaje ||
                            "No se pudo rechazar la solicitud.",
                        "⚠️",
                        null,
                        "exito"
                    );

                    return;
                }


                mostrarModal(
                    "Solicitud rechazada",
                    "La solicitud fue rechazada correctamente.",
                    "✓",
                    null,
                    "exito"
                );


                setTimeout(
                    function() {

                        const modal =
                            document.getElementById(
                                "modalCeroHambre"
                            );

                        if (modal) {

                            modal.remove();

                        }

                        cargarSolicitudes();

                    },
                    1000
                );


            } catch (error) {

                console.error(error);


                mostrarModal(
                    "Error de conexión",
                    "No se pudo conectar con el servidor.",
                    "⚠️",
                    null,
                    "exito"
                );
            }
        },

        "confirmacion",

        "Rechazar solicitud"
    );
}


// ======================================================
// REGISTRAR ENTREGA
// ======================================================

async function registrarEntrega(
    solicitudId
) {

    const usuario =
        obtenerUsuario();


    if (!usuario) {

        mostrarModal(
            "Sesión requerida",
            "Debes iniciar sesión para registrar una entrega.",
            "🔐",
            function() {

                window.location.href =
                    "login.html";

            },
            "confirmacion",
            "Iniciar sesión"
        );

        return;
    }


    if (
        usuario.tipo_usuario !==
        "donante"
    ) {

        mostrarModal(
            "Acción no permitida",
            "Solo el donante puede registrar la entrega.",
            "⚠️",
            null,
            "exito"
        );

        return;
    }


    // ------------------------------------------
    // Confirmación profesional
    // ------------------------------------------

    mostrarModal(
        "Registrar entrega",
        "¿Deseas registrar la entrega de esta solicitud?",
        "🚚",

        async function() {

            try {

                const respuesta =
                    await fetch(
                        `${API}/entregas`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                solicitud_id:
                                    solicitudId

                            })
                        }
                    );


                const datos =
                    await respuesta.json();


                if (!respuesta.ok) {

                    mostrarModal(
                        "No se pudo registrar",
                        datos.mensaje ||
                            "Ocurrió un error al registrar la entrega.",
                        "⚠️",
                        null,
                        "exito"
                    );

                    return;
                }


                // ----------------------------------
                // Mensaje de éxito
                // ----------------------------------

                mostrarModal(
                    "Entrega registrada",
                    "La entrega se registró correctamente.",
                    "✓",
                    null,
                    "exito"
                );


                // ----------------------------------
                // Ir a entregas
                // ----------------------------------

                setTimeout(
                    function() {

                        window.location.href =
                            "entregas.html";

                    },
                    1200
                );


            } catch (error) {

                console.error(error);


                mostrarModal(
                    "Error de conexión",
                    "No se pudo conectar con el servidor.",
                    "⚠️",
                    null,
                    "exito"
                );
            }
        },

        "confirmacion",

        "Registrar entrega"
    );
}


// ======================================================
// CARGAR ENTREGAS
// ======================================================

const listaEntregas =
    document.getElementById(
        "listaEntregas"
    );

if (listaEntregas) {

    cargarEntregas();
}


async function cargarEntregas() {

    try {

        const respuesta =
            await fetch(
                `${API}/entregas`
            );


        const entregas =
            await respuesta.json();


        if (!respuesta.ok) {

            listaEntregas.innerHTML = `

                <div class="actividad-card">

                    <div class="actividad-vacia">

                        <div class="actividad-icono">
                            ⚠️
                        </div>

                        <h3>
                            Error al cargar las entregas
                        </h3>

                    </div>

                </div>

            `;

            return;
        }


        if (
            entregas.length === 0
        ) {

            listaEntregas.innerHTML = `

                <div class="actividad-card">

                    <div class="actividad-vacia">

                        <div class="actividad-icono">
                            🚚
                        </div>

                        <h3>
                            No hay entregas registradas
                        </h3>

                        <p>
                            Las entregas aparecerán aquí
                            cuando una solicitud aceptada
                            sea registrada.
                        </p>

                    </div>

                </div>

            `;

            return;
        }


        listaEntregas.innerHTML =
            "";


        entregas.forEach(
            function(entrega) {

                let botones =
                    "";


                // ----------------------------------
                // PENDIENTE
                // ----------------------------------

                if (
                    entrega.estado ===
                    "pendiente"
                ) {

                    botones = `

                        <button
                            class="btn-solicitar"
                            onclick="
                                actualizarEstadoEntrega(
                                    ${entrega.id},
                                    'en_camino'
                                )
                            "
                        >
                            Enviar
                        </button>

                    `;
                }


                // ----------------------------------
                // EN CAMINO
                // ----------------------------------

                else if (
                    entrega.estado ===
                    "en_camino"
                ) {

                    botones = `

                        <button
                            class="btn-solicitar"
                            onclick="
                                actualizarEstadoEntrega(
                                    ${entrega.id},
                                    'entregada'
                                )
                            "
                        >
                            Marcar como entregada
                        </button>

                    `;
                }


                // ----------------------------------
                // ENTREGA
                // ----------------------------------

                listaEntregas.innerHTML += `

                    <div class="donacion-card">

                        <div class="donacion-icono">
                            🚚
                        </div>

                        <div class="donacion-info">

                            <h3>
                                Entrega #${entrega.id}
                            </h3>

                            <p>
                                <strong>
                                    Solicitud:
                                </strong>

                                #${entrega.solicitud_id}
                            </p>

                            <p>
                                <strong>
                                    Alimento:
                                </strong>

                                ${entrega.alimento}
                            </p>

                            <p>
                                <strong>
                                    Organización:
                                </strong>

                                ${entrega.organizacion}
                            </p>

                            <p>
                                <strong>
                                    Cantidad:
                                </strong>

                                ${entrega.cantidad_solicitada}
                            </p>

                            <p>
                                <strong>
                                    Fecha de entrega:
                                </strong>

                                ${
                                    entrega.fecha_entrega ||
                                    "Pendiente"
                                }
                            </p>

                            ${
                                entrega.observaciones
                                ? `

                                    <p>

                                        <strong>
                                            Observaciones:
                                        </strong>

                                        ${entrega.observaciones}

                                    </p>

                                `
                                : ""
                            }

                        </div>

                        <div class="donacion-acciones">

                            <div class="donacion-estado">
                                ${entrega.estado}
                            </div>

                            ${botones}

                        </div>

                    </div>

                `;
            }
        );


    } catch (error) {

        console.error(error);


        listaEntregas.innerHTML = `

            <div class="actividad-card">

                <div class="actividad-vacia">

                    <div class="actividad-icono">
                        ⚠️
                    </div>

                    <h3>
                        Error de conexión
                    </h3>

                    <p>
                        No se pudo conectar con el servidor.
                    </p>

                </div>

            </div>

        `;
    }
}


// ======================================================
// ACTUALIZAR ESTADO DE ENTREGA
// ======================================================

async function actualizarEstadoEntrega(
    id,
    estado
) {

    const titulo =
        estado === "en_camino"
            ? "Enviar entrega"
            : "Marcar como entregada";


    const mensaje =
        estado === "en_camino"
            ? "¿Deseas marcar esta entrega como en camino?"
            : "¿Deseas marcar esta entrega como entregada?";


    const textoBoton =
        estado === "en_camino"
            ? "Enviar entrega"
            : "Marcar como entregada";


    mostrarModal(
        titulo,
        mensaje,
        "🚚",

        async function() {

            try {

                const respuesta =
                    await fetch(
                        `${API}/entregas/${id}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                estado:
                                    estado

                            })
                        }
                    );


                const datos =
                    await respuesta.json();


                if (!respuesta.ok) {

                    mostrarModal(
                        "No se pudo actualizar",
                        datos.mensaje ||
                            "No se pudo actualizar la entrega.",
                        "⚠️",
                        null,
                        "exito"
                    );

                    return;
                }


                // ----------------------------------
                // EN CAMINO
                // ----------------------------------

                if (
                    estado ===
                    "en_camino"
                ) {

                    mostrarModal(
                        "Entrega en camino",
                        "La entrega ahora está en camino.",
                        "✓",
                        null,
                        "exito"
                    );

                }


                // ----------------------------------
                // ENTREGADA
                // ----------------------------------

                else {

                    mostrarModal(
                        "Entrega completada",
                        "La entrega ha sido marcada como entregada.",
                        "✓",
                        null,
                        "exito"
                    );
                }


                // ----------------------------------
                // Cerrar modal y actualizar
                // ----------------------------------

                setTimeout(
                    function() {

                        const modal =
                            document.getElementById(
                                "modalCeroHambre"
                            );

                        if (modal) {

                            modal.remove();

                        }

                        cargarEntregas();

                    },
                    1200
                );


            } catch (error) {

                console.error(error);


                mostrarModal(
                    "Error de conexión",
                    "No se pudo conectar con el servidor.",
                    "⚠️",
                    null,
                    "exito"
                );
            }
        },

        "confirmacion",

        textoBoton
    );
}


// ======================================================
// DASHBOARD - ESTADÍSTICAS
// ======================================================

async function cargarEstadisticasDashboard() {

    const totalDonaciones =
        document.getElementById(
            "totalDonaciones"
        );


    const totalSolicitudes =
        document.getElementById(
            "totalSolicitudes"
        );


    const totalEntregas =
        document.getElementById(
            "totalEntregas"
        );


    const alimentosRecuperados =
        document.getElementById(
            "alimentosRecuperados"
        );


    const impactoKg =
        document.getElementById(
            "impactoKg"
        );


    if (
        !totalDonaciones &&
        !totalSolicitudes &&
        !totalEntregas &&
        !alimentosRecuperados &&
        !impactoKg
    ) {

        return;
    }


    try {

        const [
            respuestaDonaciones,
            respuestaSolicitudes,
            respuestaEntregas,
            respuestaReportes
        ] = await Promise.all([

            fetch(
                `${API}/donaciones`
            ),

            fetch(
                `${API}/solicitudes`
            ),

            fetch(
                `${API}/entregas`
            ),

            fetch(
                `${API}/reportes`
            )

        ]);


        const donaciones =
            await respuestaDonaciones.json();


        const solicitudes =
            await respuestaSolicitudes.json();


        const entregas =
            await respuestaEntregas.json();


        const reportes =
            await respuestaReportes.json();


        if (totalDonaciones) {

            totalDonaciones.textContent =
                donaciones.length;
        }


        if (totalSolicitudes) {

            totalSolicitudes.textContent =
                solicitudes.length;
        }


        if (totalEntregas) {

            totalEntregas.textContent =
                entregas.length;
        }


        if (
            alimentosRecuperados &&
            reportes.datos
        ) {

            alimentosRecuperados.textContent =
                reportes.datos
                    .alimentos_recuperados ||
                0;
        }


        if (
            impactoKg &&
            reportes.datos
        ) {

            impactoKg.textContent =
                reportes.datos
                    .alimentos_recuperados ||
                0;
        }


    } catch (error) {

        console.error(
            "Error al cargar estadísticas:",
            error
        );
    }
}


cargarEstadisticasDashboard();


// ======================================================
// REPORTES
// ======================================================

const reportesContainer =
    document.getElementById(
        "reportesContainer"
    );


if (reportesContainer) {

    cargarReportes();
}


async function cargarReportes() {

    try {

        const respuesta =
            await fetch(
                `${API}/reportes`
            );


        const datos =
            await respuesta.json();


        if (!respuesta.ok) {

            reportesContainer.innerHTML = `

                <div class="actividad-card">

                    <div class="actividad-vacia">

                        <div class="actividad-icono">
                            ⚠️
                        </div>

                        <h3>
                            Error al cargar reportes
                        </h3>

                    </div>

                </div>

            `;

            return;
        }


        const reporte =
            datos.datos;


        reportesContainer.innerHTML = `

            <div class="dashboard-estadisticas">

                <div class="dashboard-card">

                    <div class="card-icon">
                        🍎
                    </div>

                    <div>

                        <span>
                            Alimentos recuperados
                        </span>

                        <strong>
                            ${
                                reporte.alimentos_recuperados ||
                                0
                            }
                        </strong>

                        <small>
                            kg
                        </small>

                    </div>

                </div>


                <div class="dashboard-card">

                    <div class="card-icon">
                        🏢
                    </div>

                    <div>

                        <span>
                            Organizaciones atendidas
                        </span>

                        <strong>
                            ${
                                reporte.organizaciones_atendidas ||
                                0
                            }
                        </strong>

                    </div>

                </div>


                <div class="dashboard-card">

                    <div class="card-icon">
                        🚚
                    </div>

                    <div>

                        <span>
                            Entregas realizadas
                        </span>

                        <strong>
                            ${
                                reporte.entregas_realizadas ||
                                0
                            }
                        </strong>

                    </div>

                </div>


                <div class="dashboard-card">

                    <div class="card-icon">
                        🤝
                    </div>

                    <div>

                        <span>
                            Organizaciones beneficiadas
                        </span>

                        <strong>
                            ${
                                reporte.organizaciones_beneficiadas ||
                                0
                            }
                        </strong>

                    </div>

                </div>

            </div>

        `;


    } catch (error) {

        console.error(error);


        reportesContainer.innerHTML = `

            <div class="actividad-card">

                <div class="actividad-vacia">

                    <div class="actividad-icono">
                        ⚠️
                    </div>

                    <h3>
                        Error de conexión
                    </h3>

                    <p>
                        No se pudo conectar con el servidor.
                    </p>

                </div>

            </div>

        `;
    }
}

// ======================================================
// ACTIVIDAD RECIENTE DEL DASHBOARD
// ======================================================

const actividadReciente =
    document.getElementById("actividadReciente");

if (actividadReciente) {
    cargarActividadReciente();
}

async function cargarActividadReciente() {

    const usuario = obtenerUsuario();

    if (!usuario) {
        actividadReciente.innerHTML = `
            <div class="actividad-vacia">
                <div class="actividad-icono">
                    🔐
                </div>

                <h3>
                    Inicia sesión
                </h3>

                <p>
                    Inicia sesión para consultar tu actividad.
                </p>
            </div>
        `;

        return;
    }

    try {

        const [
            respuestaDonaciones,
            respuestaSolicitudes,
            respuestaEntregas
        ] = await Promise.all([

            fetch(`${API}/donaciones`),

            fetch(`${API}/solicitudes`),

            fetch(`${API}/entregas`)

        ]);

        const donaciones =
            await respuestaDonaciones.json();

        const solicitudes =
            await respuestaSolicitudes.json();

        const entregas =
            await respuestaEntregas.json();

        let actividades = [];

        // ==================================================
        // ACTIVIDAD DEL DONANTE
        // ==================================================

        if (usuario.tipo_usuario === "donante") {

            // Donaciones realizadas por el usuario
            const misDonaciones =
                donaciones.filter(function(donacion) {

                    return Number(donacion.usuario_id) ===
                        Number(usuario.id);

                });

            misDonaciones.forEach(function(donacion) {

                actividades.push({
                    tipo: "donacion",
                    fecha: donacion.fecha_publicacion,
                    icono: "🍎",
                    titulo: "Donación publicada",
                    descripcion:
                        `${donacion.alimento} · ${donacion.cantidad} ${donacion.unidad}`,
                    estado: donacion.estado
                });

            });

            // Solicitudes recibidas sobre sus donaciones
            solicitudes.forEach(function(solicitud) {

                const donacion =
                    donaciones.find(function(d) {

                        return Number(d.id) ===
                            Number(solicitud.donacion_id);

                    });

                if (
                    donacion &&
                    Number(donacion.usuario_id) ===
                    Number(usuario.id)
                ) {

                    actividades.push({
                        tipo: "solicitud",
                        fecha: solicitud.fecha_solicitud,
                        icono: "📋",
                        titulo: "Nueva solicitud",
                        descripcion:
                            `${solicitud.organizacion} solicitó ${solicitud.cantidad_solicitada}`,
                        estado: solicitud.estado
                    });

                }

            });

            // Entregas relacionadas con solicitudes del donante
            solicitudes.forEach(function(solicitud) {

                const donacion =
                    donaciones.find(function(d) {

                        return Number(d.id) ===
                            Number(solicitud.donacion_id);

                    });

                if (
                    donacion &&
                    Number(donacion.usuario_id) ===
                    Number(usuario.id)
                ) {

                    const entregasSolicitud =
                        entregas.filter(function(entrega) {

                            return Number(entrega.solicitud_id) ===
                                Number(solicitud.id);

                        });

                    entregasSolicitud.forEach(function(entrega) {

                        actividades.push({
                            tipo: "entrega",
                            fecha: entrega.fecha_entrega,
                            icono: "🚚",
                            titulo: "Entrega registrada",
                            descripcion:
                                `${entrega.alimento} · ${entrega.organizacion}`,
                            estado: entrega.estado
                        });

                    });

                }

            });

        }

        // ==================================================
        // ACTIVIDAD DE LA ORGANIZACIÓN
        // ==================================================

        if (usuario.tipo_usuario === "organizacion") {

            solicitudes.forEach(function(solicitud) {

                if (
                    Number(solicitud.organizacion_id) ===
                    Number(usuario.id)
                ) {

                    actividades.push({
                        tipo: "solicitud",
                        fecha: solicitud.fecha_solicitud,
                        icono: "📋",
                        titulo: "Solicitud realizada",
                        descripcion:
                            `Solicitud #${solicitud.id} · ${solicitud.cantidad_solicitada}`,
                        estado: solicitud.estado
                    });

                }

            });

            solicitudes.forEach(function(solicitud) {

                if (
                    Number(solicitud.organizacion_id) !==
                    Number(usuario.id)
                ) {
                    return;
                }

                const entregasSolicitud =
                    entregas.filter(function(entrega) {

                        return Number(entrega.solicitud_id) ===
                            Number(solicitud.id);

                    });

                entregasSolicitud.forEach(function(entrega) {

                    actividades.push({
                        tipo: "entrega",
                        fecha: entrega.fecha_entrega,
                        icono: "🚚",
                        titulo: "Entrega",
                        descripcion:
                            `${entrega.alimento} · ${entrega.cantidad_solicitada}`,
                        estado: entrega.estado
                    });

                });

            });

        }

        // ==================================================
        // ORDENAR ACTIVIDAD
        // ==================================================

        actividades.sort(function(a, b) {

            const fechaA =
                a.fecha
                    ? new Date(a.fecha).getTime()
                    : 0;

            const fechaB =
                b.fecha
                    ? new Date(b.fecha).getTime()
                    : 0;

            return fechaB - fechaA;

        });

        // Mostrar solamente las 5 más recientes
        actividades =
            actividades.slice(0, 5);

        // ==================================================
        // SIN ACTIVIDAD
        // ==================================================

        if (actividades.length === 0) {

            actividadReciente.innerHTML = `
                <div class="actividad-vacia">

                    <div class="actividad-icono">
                        📊
                    </div>

                    <h3>
                        Aún no hay actividad
                    </h3>

                    <p>
                        Tus movimientos aparecerán aquí
                        automáticamente.
                    </p>

                </div>
            `;

            return;
        }

        // ==================================================
        // MOSTRAR ACTIVIDAD
        // ==================================================

        actividadReciente.innerHTML = "";

        actividades.forEach(function(actividad) {

            actividadReciente.innerHTML += `

                <div class="actividad-item">

                    <div class="actividad-item-icono">
                        ${actividad.icono}
                    </div>

                    <div class="actividad-item-info">

                        <strong>
                            ${actividad.titulo}
                        </strong>

                        <p>
                            ${actividad.descripcion}
                        </p>

                    </div>

                    <div class="actividad-item-estado">

                        <span class="donacion-estado">
                            ${actividad.estado}
                        </span>

                    </div>

                </div>

            `;

        });

    } catch (error) {

        console.error(
            "Error al cargar actividad reciente:",
            error
        );

        actividadReciente.innerHTML = `
            <div class="actividad-vacia">

                <div class="actividad-icono">
                    ⚠️
                </div>

                <h3>
                    No se pudo cargar la actividad
                </h3>

                <p>
                    Intenta nuevamente en unos momentos.
                </p>

            </div>
        `;
    }
}
