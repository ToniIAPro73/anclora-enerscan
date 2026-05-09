import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #00DC82',
    paddingBottom: 10,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 6,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    color: '#0A0A0A',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#7A7A7A',
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#00DC82',
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottom: '1 solid #eeeeee',
    paddingBottom: 5,
  },
  text: {
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.5,
    marginBottom: 5,
  },
  bold: {
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  annexRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottom: '1 solid #f1f1f1',
  },
  colLeft: {
    width: '40%',
    fontSize: 10,
    color: '#7A7A7A',
  },
  colRight: {
    width: '60%',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0A0A0A',
  },
  scoreBox: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  letter: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00DC82',
  },
  disclaimer: {
    marginTop: 30,
    padding: 10,
    backgroundColor: '#fff3cd',
    fontSize: 8,
    color: '#856404',
    fontStyle: 'italic',
  },
  scenarioBox: {
    border: '1 solid #e0e0e0',
    padding: 10,
    marginBottom: 10,
    borderRadius: 4,
  },
  scenarioTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0A0A0A',
    marginBottom: 5,
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bulletPoint: {
    width: 10,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
  },
  annexMetaBox: {
    border: '1 solid #e0e0e0',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 4,
  },
  documentFrame: {
    minHeight: 420,
    border: '1 solid #e0e0e0',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  attachmentImage: {
    maxWidth: '100%',
    maxHeight: 500,
    objectFit: 'contain',
  },
  imageAnnexGrid: {
    gap: 18,
  },
  imageAnnexCard: {
    height: 235,
    border: '1 solid #e0e0e0',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
  },
  imageCaption: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0A0A0A',
    marginBottom: 8,
  },
  annexImage: {
    width: '100%',
    height: 166,
    objectFit: 'cover',
    borderRadius: 4,
  },
  imageMeta: {
    marginTop: 7,
    fontSize: 8,
    color: '#7A7A7A',
  },
  preText: {
    fontSize: 9,
    color: '#333333',
    lineHeight: 1.35,
  }
});
