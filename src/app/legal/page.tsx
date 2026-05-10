import type { Metadata } from 'next';
import LegalDocumentLayout from '@/components/LegalDocumentLayout';

export const metadata: Metadata = {
  title: 'Aviso legal | Anclora EnergyScan',
  description: 'Aviso legal de Anclora EnergyScan.',
};

export default function LegalNoticePage() {
  return (
    <LegalDocumentLayout
      title="Aviso legal"
      description="Información general del titular del sitio y condiciones básicas de acceso a Anclora EnergyScan."
      updatedAt="10 de mayo de 2026"
      sections={[
        {
          title: 'Titular del sitio',
          paragraphs: [
            'Titular: Anclora EnergyScan, proyecto operado por Anclora.',
            'Sitio web: https://anclora-energyscan.vercel.app/',
            'Email de contacto: hola@enerscan.app.',
          ],
        },
        {
          title: 'Finalidad del sitio',
          paragraphs: [
            'El sitio ofrece una herramienta web de prediagnóstico energético orientativo para viviendas, generación de informes informativos y preparación de solicitudes de contacto con profesionales o proveedores.',
          ],
        },
        {
          title: 'Naturaleza informativa',
          paragraphs: [
            'La información mostrada en la aplicación, en la web y en los informes PDF tiene carácter orientativo, comercial e informativo. No constituye asesoramiento técnico definitivo, certificación energética oficial, informe pericial, valoración inmobiliaria oficial ni asesoramiento legal.',
          ],
        },
        {
          title: 'Propiedad intelectual',
          paragraphs: [
            'Los textos, diseño, marca, estructura, software y materiales propios de Anclora EnergyScan pertenecen a sus respectivos titulares. El usuario no puede reproducir, explotar o reutilizar estos elementos fuera del uso normal de la aplicación sin autorización.',
          ],
        },
        {
          title: 'Contenido aportado por el usuario',
          paragraphs: [
            'El usuario conserva la responsabilidad sobre la documentación, imágenes y datos que sube a la aplicación. Al aportarlos, autoriza su tratamiento técnico para prestar el servicio solicitado, generar informes y conservar evidencias asociadas a la valoración.',
          ],
        },
        {
          title: 'Enlaces externos y terceros',
          paragraphs: [
            'La aplicación puede enlazar o integrarse con servicios de terceros como proveedores de autenticación, alojamiento, almacenamiento o potenciales partners. Anclora EnergyScan no controla las políticas externas de esos servicios y recomienda revisar sus condiciones aplicables.',
          ],
        },
        {
          title: 'Jurisdicción',
          paragraphs: [
            'Este aviso se interpreta conforme a la normativa española y europea aplicable, sin perjuicio de los derechos imperativos que correspondan a consumidores y usuarios.',
          ],
        },
      ]}
    />
  );
}
