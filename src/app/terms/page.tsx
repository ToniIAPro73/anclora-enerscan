import type { Metadata } from 'next';
import LegalDocumentLayout from '@/components/LegalDocumentLayout';

export const metadata: Metadata = {
  title: 'Términos del servicio | Anclora EnergyScan',
  description: 'Condiciones de uso de Anclora EnergyScan.',
};

export default function TermsPage() {
  return (
    <LegalDocumentLayout
      title="Términos del servicio"
      description="Estas condiciones regulan el uso de Anclora EnergyScan como plataforma de prediagnóstico energético orientativo para viviendas."
      updatedAt="10 de mayo de 2026"
      sections={[
        {
          title: 'Objeto del servicio',
          paragraphs: [
            'Anclora EnergyScan permite introducir datos de una vivienda, adjuntar documentación, obtener una estimación energética orientativa, visualizar propuestas de mejora y generar informes informativos.',
          ],
        },
        {
          title: 'No sustitución de certificado oficial',
          paragraphs: [
            'Anclora EnergyScan no emite Certificados de Eficiencia Energética oficiales, no realiza inspecciones técnicas y no sustituye el criterio de un técnico competente. Cualquier resultado debe entenderse como una simulación informativa basada en los datos declarados por el usuario.',
          ],
        },
        {
          title: 'Cuenta de usuario',
          items: [
            'El usuario debe facilitar información veraz y mantener la confidencialidad de sus credenciales.',
            'El usuario es responsable de la actividad realizada desde su cuenta.',
            'La aplicación puede suspender accesos cuando exista uso abusivo, fraudulento o contrario a estas condiciones.',
          ],
        },
        {
          title: 'Datos y adjuntos aportados',
          paragraphs: [
            'El usuario garantiza que tiene derecho a subir los archivos que aporta y que estos no infringen derechos de terceros ni contienen contenido ilícito. Los adjuntos se usan como soporte documental para el informe y la experiencia de usuario, sin que ello implique validación técnica automática.',
          ],
        },
        {
          title: 'Solicitudes de contacto con proveedores',
          paragraphs: [
            'La aplicación puede permitir solicitar contacto con proveedores o partners. Esa conexión se realiza como solicitud de información o presupuesto, sin garantía de aceptación, resultado, precio, plazo, visita técnica ni ejecución de actuaciones.',
          ],
        },
        {
          title: 'Costes, ahorros y recomendaciones',
          paragraphs: [
            'Los costes, ahorros, mejoras y categorías de proveedores sugeridas son estimaciones orientativas. Antes de contratar una actuación, el usuario debe solicitar presupuesto, revisión técnica y documentación contractual directamente a profesionales cualificados.',
          ],
        },
        {
          title: 'Disponibilidad',
          paragraphs: [
            'Anclora EnergyScan se presta como aplicación web en evolución. Pueden existir interrupciones, cambios funcionales o limitaciones temporales por mantenimiento, proveedores técnicos o despliegues.',
          ],
        },
        {
          title: 'Uso prohibido',
          items: [
            'Usar la aplicación para emitir o simular certificados oficiales con apariencia de validez administrativa.',
            'Subir archivos maliciosos, ilícitos, confidenciales de terceros sin autorización o con derechos de autor no autorizados.',
            'Intentar acceder a cuentas, datos o sistemas de otros usuarios.',
            'Automatizar peticiones abusivas o interferir con la seguridad del servicio.',
          ],
        },
        {
          title: 'Responsabilidad',
          paragraphs: [
            'La responsabilidad de Anclora EnergyScan queda limitada al funcionamiento razonable de la herramienta informativa. No asumimos responsabilidad por decisiones técnicas, económicas, inmobiliarias o legales tomadas exclusivamente con base en una estimación orientativa.',
          ],
        },
        {
          title: 'Contacto',
          paragraphs: [
            'Para cuestiones sobre estas condiciones puedes escribir a hola@enerscan.app.',
          ],
        },
      ]}
    />
  );
}
