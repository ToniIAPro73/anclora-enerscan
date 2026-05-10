import type { Metadata } from 'next';
import LegalDocumentLayout from '@/components/LegalDocumentLayout';

export const metadata: Metadata = {
  title: 'Política de privacidad | Anclora EnergyScan',
  description: 'Política de privacidad de Anclora EnergyScan.',
};

export default function PrivacyPage() {
  return (
    <LegalDocumentLayout
      title="Política de privacidad"
      description="Esta política explica cómo Anclora EnergyScan trata los datos personales usados para crear cuentas, generar prediagnósticos energéticos orientativos, gestionar adjuntos y tramitar solicitudes de contacto."
      updatedAt="10 de mayo de 2026"
      sections={[
        {
          title: 'Responsable y contacto',
          paragraphs: [
            'Responsable del tratamiento: Anclora EnergyScan, proyecto operado por Anclora.',
            'Contacto para privacidad: hola@enerscan.app.',
          ],
        },
        {
          title: 'Datos que podemos tratar',
          items: [
            'Datos de cuenta: nombre, email, proveedor de autenticación y datos técnicos de sesión.',
            'Datos declarados de la vivienda: tipo de inmueble, año de construcción, superficie, código postal, orientación, instalaciones, ventanas, aislamiento, renovables, presupuesto y horizonte temporal.',
            'Documentación aportada por el usuario: imágenes, PDF de CEE u otros archivos admitidos que el usuario suba voluntariamente.',
            'Solicitudes de contacto: nombre, email, teléfono, servicio solicitado, urgencia, presupuesto estimado, zona y consentimiento.',
            'Datos técnicos: dirección IP, user-agent, registros de seguridad, cookies técnicas y eventos necesarios para operar la aplicación.',
          ],
        },
        {
          title: 'Finalidades',
          items: [
            'Crear y mantener la cuenta de usuario.',
            'Generar un prediagnóstico energético orientativo y un informe PDF cuando el usuario lo solicite.',
            'Conservar valoraciones, adjuntos y solicitudes asociadas a la cuenta.',
            'Gestionar solicitudes de contacto con proveedores o partners cuando el usuario lo pida.',
            'Proteger la seguridad de la aplicación, prevenir abuso y diagnosticar incidencias técnicas.',
          ],
        },
        {
          title: 'Base legal',
          paragraphs: [
            'El tratamiento se basa en la ejecución del servicio solicitado por el usuario, el consentimiento para comunicaciones o solicitudes de contacto, el cumplimiento de obligaciones legales aplicables y el interés legítimo en mantener la seguridad y calidad técnica de la plataforma.',
          ],
        },
        {
          title: 'Autenticación social',
          paragraphs: [
            'Si el usuario accede con Google o GitHub, Anclora EnergyScan recibe los datos mínimos facilitados por el proveedor de identidad, normalmente email, nombre y un identificador técnico de cuenta. No solicitamos acceso al correo, repositorios u otros contenidos privados salvo que se indique expresamente en el flujo de autorización.',
          ],
        },
        {
          title: 'Almacenamiento y proveedores técnicos',
          paragraphs: [
            'La aplicación puede usar Neon Postgres para datos estructurados, Vercel Blob para documentos y archivos pesados, Vercel para alojamiento y Auth.js para autenticación. Estos servicios actúan como proveedores técnicos necesarios para prestar la aplicación.',
          ],
        },
        {
          title: 'Conservación',
          paragraphs: [
            'Los datos se conservan mientras la cuenta esté activa o mientras sean necesarios para prestar el servicio solicitado. El usuario puede solicitar la eliminación de su cuenta, valoraciones o adjuntos escribiendo al contacto indicado.',
          ],
        },
        {
          title: 'Derechos',
          paragraphs: [
            'El usuario puede solicitar acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad cuando proceda. Para ejercer estos derechos debe escribir a hola@enerscan.app indicando el email asociado a la cuenta.',
          ],
        },
        {
          title: 'Carácter orientativo',
          paragraphs: [
            'Anclora EnergyScan no genera Certificados de Eficiencia Energética oficiales. Las estimaciones, letras, costes y recomendaciones son orientativas y deben contrastarse con un técnico competente antes de tomar decisiones técnicas, económicas o legales.',
          ],
        },
      ]}
    />
  );
}
