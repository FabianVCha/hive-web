"use client";

import Link from "next/link";
import { GuestCheckout } from "./guest-checkout";
import { cartTotal } from "@/lib/prototype.mjs";
import { products, money } from "./catalog";
import { Icon, useCart } from "./shell";
import { QuantityInput } from "./quantity-input";
import { SafeImage } from "./safe-image";

export function CartView() {
  const { cart, ready, setQuantity } = useCart();
  const total = cartTotal(cart, products);
  return (
    <div className="page-pad purchase-page">
      <div className="breadcrumb">
        <Link href="/">Inicio</Link>
        <span>/</span>
        <span>Carrito</span>
      </div>
      <div className="section-heading">
        <h1>
          Tu selección,
          <br />a un paso.
        </h1>
        <Link className="text-link" href="/catalogo">
          Seguir explorando <Icon name="arrow" size={20} />
        </Link>
      </div>
      {!ready ? (
        <p>Cargando tu carrito…</p>
      ) : !cart.length ? (
        <div className="empty-state">
          <Icon name="bag" size={48} />
          <h2>Tu carrito empieza aquí.</h2>
          <p>Aún no tienes productos en el carrito.</p>
          <Link href="/catalogo" className="button button-red">
            Explorar productos <Icon name="arrow" />
          </Link>
        </div>
      ) : (
        <div className="purchase-layout">
          <div className="cart-items">
            {cart.map((item) => {
              const product = products.find((p) => p.slug === item.slug)!;
              return (
                <article className="cart-item" key={item.slug}>
                  <Link href={`/p/${item.slug}`}>
                    <SafeImage
                      src={product.image}
                      width="170"
                      height="170"
                      alt={product.name}
                    />
                  </Link>
                  <div>
                    <span className="product-brand">{product.brand}</span>
                    <h2>
                      <Link href={`/p/${item.slug}`}>{product.name}</Link>
                    </h2>
                    <span>{money(product.price)} por unidad</span>
                    <button
                      className="remove-item"
                      onClick={() => setQuantity(item.slug, 0)}
                    >
                      Eliminar
                    </button>
                  </div>
                  <div className="cart-item-controls">
                    <strong>{money(product.price * item.quantity)}</strong>
                    <QuantityInput name={product.name} value={item.quantity} onChange={(quantity) => setQuantity(item.slug, quantity)} />
                  </div>
                </article>
              );
            })}
            <div className="cart-guidance">
              <Icon name="check" />
              <p>
                ¿Todo listo? Comprueba las medidas y la compatibilidad de cada
                producto antes de continuar.
              </p>
            </div>
          </div>
          <aside className="order-summary">
            <h2>Resumen de tu compra</h2>
            <div className="summary-row">
              <span>
                Productos ({cart.reduce((n, p) => n + p.quantity, 0)})
              </span>
              <span>{money(total)}</span>
            </div>
            <div className="summary-row">
              <span>Envío estimado a Bogotá</span>
              <span>{money(12000)}</span>
            </div>
            <p className="summary-note">
              Podrás elegir la zona en el siguiente paso.
            </p>
            <div className="summary-total">
              <span>Total estimado</span>
              <strong>{money(total + 12000)}</strong>
            </div>
            <Link href="/checkout" className="button button-red">
              Continuar con la compra <Icon name="arrow" size={20} />
            </Link>
            <p className="demo-note">
              Compra simulada. No se realizará ningún cobro.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

export function CheckoutView() { return <GuestCheckout />; }

export function InformationView() {
  return (
    <div className="page-pad information-page">
      <div className="breadcrumb">
        <Link href="/">Inicio</Link>
        <span>/</span>
        <span>Información</span>
      </div>
      <h1>
        Elegir con claridad.
        <br />
        Comprar con confianza.
      </h1>
      <p className="information-intro">
        Información de ejemplo para personalizar tu tienda.
      </p>
      <section>
        <h2>Entregas cerca de ti.</h2>
        <p>
          Para probar el flujo, esta plantilla usa Bogotá, Chía y Soacha como
          zonas de ejemplo. No representan la cobertura de una tienda activa.
        </p>
        <p>
          Tarifas de ejemplo: Bogotá $12.000 y alrededores $18.000. Plazos de
          ejemplo: 1–2 y 2–3 días hábiles respectivamente. La cobertura, tarifas
          y fechas reales aún no están definidas.
        </p>
      </section>
      <section>
        <h2>La pieza correcta empieza por los detalles.</h2>
        <p>
          En cada ficha encontrarás usos, especificaciones, contenido y
          consideraciones de compatibilidad. No es necesario seguir una guía
          para comprar: puedes buscar un producto o entrar directamente a su
          ficha.
        </p>
        <p>
          Reemplaza estos textos por la información real de tus productos antes
          de publicar el catálogo.
        </p>
      </section>
      <section>
        <h2>Cambios y garantías, sin inventar condiciones.</h2>
        <p>
          Las políticas comerciales, garantías por producto y condiciones de
          devolución se definirán antes de habilitar ventas. Esta demo no
          promete coberturas ni plazos de garantía que todavía no han sido
          aprobados.
        </p>
      </section>
      <section id="demo">
        <h2>Una demostración, no una tienda activa.</h2>
        <p>
          Precios, existencias, envíos y el flujo de compra son simulados. No
          hay pasarela de pago, pedidos reales ni formularios enviados. El carrito
          y las selecciones de objetivos se guardan en este navegador. Los datos
          de entrega solo permanecen en memoria; el PDF se descarga localmente.
        </p>
        <p>
          El catálogo contiene tres productos de ejemplo con espacios reservados
          para imágenes. Los nombres, descripciones, precios y contenidos no
          representan productos a la venta.
        </p>
        <p>
          Personaliza la identidad, el catálogo y las condiciones comerciales
          antes de habilitar ventas. No se incluyen reseñas ni garantías ficticias.
        </p>
      </section>
      <Link className="button button-dark" href="/catalogo">
        Volver a la tienda <Icon name="arrow" />
      </Link>
    </div>
  );
}
