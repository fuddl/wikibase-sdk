const should = require('should')
const _ = require('lodash')
const Q571 = require('./data/Q571.json')
const Q646148 = require('./data/Q646148.json')
const Q4132785 = require('./data/Q4132785.json')
const Q328212 = require('./data/Q328212.json')
const Q22002395 = require('./data/Q22002395.json')
const Q2112 = require('./data/Q2112.json')
const Q217447 = require('./data/Q217447.json')
const Q271094 = require('./data/Q271094.json')
const Q4115189 = require('./data/Q4115189.json')
const Q275937 = require('./data/Q275937.json')
const Q1 = require('./data/Q1.json')
const L525 = require('./data/L525.json')
const oldClaimFormat = require('./data/old_claim_format.json')
const lexemeClaim = require('./data/lexeme_claim.json')
const emptyValues = require('./data/empty_values.json')

const { simplifyClaim, simplifyPropertyClaims, simplifyClaims } = require('../lib/helpers/simplify_claims')

describe('simplifyClaims', () => {
  it('env', () => {
    Q571.should.be.an.Object()
    Q571.claims.should.be.ok()
    Q4132785.should.be.an.Object()
    Q4132785.claims.P577[0].should.be.ok()
  })

  it('should return an object', () => {
    simplifyClaims(Q571.claims).should.be.an.Object()
  })

  it('should not mutate the original object', () => {
    const simplified = simplifyClaims(Q571.claims)
    simplified.should.not.equal(Q571.claims)
    simplified.P487.should.not.equal(Q571.claims.P487)
  })

  it('should return an object of same length', () => {
    const originalLength = Object.keys(Q571.claims).length
    const simplified = simplifyClaims(Q571.claims)
    const newLength = Object.keys(simplified).length
    newLength.should.equal(originalLength)
  })

  it('should return an indexed collection of arrays', () => {
    const simplified = simplifyClaims(Q571.claims)
    for (const key in simplified) {
      simplified[key].should.be.an.Array()
    }
  })

  it('should pass entity and property prefixes down', () => {
    const simplified = simplifyClaims(Q2112.claims, { entityPrefix: 'wd' })
    simplified.P190[0].should.equal('wd:Q207614')
    const simplified2 = simplifyClaims(Q2112.claims, { propertyPrefix: 'wdt' })
    simplified2['wdt:P123456789'][0].should.equal('P207614')
  })

  it('should return prefixed properties if passed a property prefix', () => {
    const simplified = simplifyClaims(Q2112.claims, { entityPrefix: 'wd', propertyPrefix: 'wdt' })
    simplified['wdt:P190'].should.be.an.Array()
    simplified['wdt:P190'][0].should.equal('wd:Q207614')
    const simplified2 = simplifyClaims(Q2112.claims, { propertyPrefix: 'wdt' })
    simplified2['wdt:P123456789'][0].should.equal('P207614')
  })

  it('should return the correct value when called with keepQualifiers=true', () => {
    const simplified = simplifyClaims(Q571.claims)
    const simplifiedWithQualifiers = simplifyClaims(Q571.claims, { keepQualifiers: true })
    Object.keys(simplifiedWithQualifiers).forEach(property => {
      const propertyValues = simplifiedWithQualifiers[property]
      propertyValues.should.be.an.Array()
      propertyValues.forEach((valueObj, index) => {
        valueObj.should.be.an.Object()
        const value = simplified[property][index]
        valueObj.value.should.equal(value)
        valueObj.qualifiers.should.be.an.Object()
      })
    })
  })

  it('should include prefixes in qualifiers claims', () => {
    const simplifiedWithQualifiers = simplifyClaims(Q646148.claims, { entityPrefix: 'wd', propertyPrefix: 'wdt', keepQualifiers: true })
    simplifiedWithQualifiers['wdt:P39'][1].qualifiers['wdt:P1365'].should.be.an.Array()
    simplifiedWithQualifiers['wdt:P39'][1].qualifiers['wdt:P1365'][0].should.equal('wd:Q312881')
  })
})

describe('simplifyPropertyClaims', () => {
  it('should return an arrays', () => {
    const simplified = simplifyPropertyClaims(Q571.claims.P487)
    simplified.should.be.an.Array()
  })

  it('should not mutate the original array', () => {
    const simplified = simplifyPropertyClaims(Q571.claims.P487)
    simplified.should.not.equal(Q571.claims.P487)
    simplified[0].should.not.equal(Q571.claims.P487[0])
  })

  it('should keep only non-null values', () => {
    const simplified = simplifyPropertyClaims(Q22002395.claims.P50)
    // Q22002395 P50 has 2 values with "snaktype": "somevalue"
    // that should be removed
    _.every(simplified, qid => qid != null).should.equal(true)
  })

  it('should deduplicated values', () => {
    const { P50 } = Q22002395.claims
    const claimsWithDuplicates = P50.concat(P50)
    const simplified = simplifyPropertyClaims(claimsWithDuplicates)
    while (simplified.length > 0) {
      const nextValue = simplified.pop()
      simplified.includes(nextValue).should.be.false()
    }
  })

  it('should pass entity and property prefixes down', () => {
    const simplified = simplifyPropertyClaims(Q2112.claims.P190, { entityPrefix: 'wd' })
    simplified[0].should.equal('wd:Q207614')
    const simplified2 = simplifyPropertyClaims(Q2112.claims.P123456789, { entityPrefix: 'a', propertyPrefix: 'b' })
    simplified2[0].should.equal('a:P207614')
  })

  it('should return the correct value when called with keepQualifiers=true', () => {
    const simplified = simplifyPropertyClaims(Q571.claims.P279)
    const simplifiedWithQualifiers = simplifyPropertyClaims(Q571.claims.P279, { keepQualifiers: true })
    simplifiedWithQualifiers.should.be.an.Array()
    simplifiedWithQualifiers.forEach((valueObj, index) => {
      valueObj.should.be.an.Object()
      const value = simplified[index]
      valueObj.value.should.equal(value)
      valueObj.qualifiers.should.be.an.Object()
    })
  })

  it('should include prefixes in qualifiers claims', () => {
    const simplifiedWithQualifiers = simplifyPropertyClaims(Q646148.claims.P39, { entityPrefix: 'wd', propertyPrefix: 'wdt', keepQualifiers: true })
    simplifiedWithQualifiers[1].qualifiers['wdt:P1365'].should.be.an.Array()
    simplifiedWithQualifiers[1].qualifiers['wdt:P1365'][0].should.equal('wd:Q312881')
  })

  it('construct entity ids for old dump format', () => {
    const simplified = simplifyPropertyClaims(oldClaimFormat)
    simplified.length.should.equal(2)
    simplified[0].should.equal('Q123')
    simplified[1].should.equal('P123')
  })

  it('should tolerate empty inputs', () => {
    const simplified = simplifyPropertyClaims()
    simplified.should.be.an.Array()
    simplified.length.should.equal(0)
    const simplified2 = simplifyPropertyClaims([])
    simplified2.should.be.an.Array()
    simplified2.length.should.equal(0)
  })

  describe('ranks', () => {
    it('should return only truthy statements by default', () => {
      const simplified = simplifyPropertyClaims(Q4115189.claims.P135)
      simplified.length.should.equal(1)
      simplified.should.deepEqual([ 'Q2044250' ])
    })

    it('should return non-truthy statements if requested', () => {
      const options = { keepNonTruthy: true }
      const simplified = simplifyPropertyClaims(Q4115189.claims.P135, options)
      simplified.should.deepEqual([ 'Q213454', 'Q2044250', 'Q5843' ])
    })

    it('should return non-deprecated statements if requested', () => {
      const options = { keepNonDeprecated: true }
      const simplified = simplifyPropertyClaims(Q4115189.claims.P135, options)
      simplified.length.should.equal(2)
      simplified.should.deepEqual([ 'Q2044250', 'Q5843' ])
    })

    it('should keep ranks', () => {
      simplifyPropertyClaims(Q4115189.claims.P135, { keepRanks: true })
      .should.deepEqual([
        { value: 'Q2044250', rank: 'preferred' }
      ])
      simplifyPropertyClaims(Q4115189.claims.P135, { keepRanks: true, keepNonTruthy: true })
      .should.deepEqual([
        { value: 'Q213454', rank: 'deprecated' },
        { value: 'Q2044250', rank: 'preferred' },
        { value: 'Q5843', rank: 'normal' }
      ])
    })
  })

  describe('empty values', () => {
    it('should not filter-out empty values if given a placeholder value', () => {
      simplifyPropertyClaims(emptyValues.claims.P3984).length.should.equal(1)
      simplifyPropertyClaims(emptyValues.claims.P3984, { novalueValue: '-' }).length.should.equal(2)
      simplifyPropertyClaims(emptyValues.claims.P3984, { novalueValue: null }).length.should.equal(2)
      simplifyPropertyClaims(emptyValues.claims.P3984, { somevalueValue: '?' }).length.should.equal(2)
      simplifyPropertyClaims(emptyValues.claims.P3984, { somevalueValue: null }).length.should.equal(2)
      simplifyPropertyClaims(emptyValues.claims.P3984, { novalueValue: null, somevalueValue: null }).length.should.equal(3)
      simplifyPropertyClaims(emptyValues.claims.P3984, { novalueValue: '-', somevalueValue: '?' }).length.should.equal(3)
      simplifyPropertyClaims(emptyValues.claims.P3984, { novalueValue: '-', somevalueValue: '?' }).should.deepEqual([ '-', '?', 'bacasable' ])
    })

    it('should keep snaktype if requested', () => {
      simplifyPropertyClaims(emptyValues.claims.P3984, { keepSnaktypes: true }).should.deepEqual([
        { value: undefined, snaktype: 'novalue' },
        { value: undefined, snaktype: 'somevalue' },
        { value: 'bacasable', snaktype: 'value' }
      ])
      simplifyPropertyClaims(emptyValues.claims.P3984, {
        keepSnaktypes: true,
        novalueValue: '-',
        somevalueValue: '?'
      })
      .should.deepEqual([
        { value: '-', snaktype: 'novalue' },
        { value: '?', snaktype: 'somevalue' },
        { value: 'bacasable', snaktype: 'value' }
      ])
    })

    it('should not filter-out empty values if requested as object values', () => {
      simplifyPropertyClaims(emptyValues.claims.P3984, { keepQualifiers: true }).should.deepEqual([
        { value: undefined, qualifiers: {} },
        { value: undefined, qualifiers: {} },
        { value: 'bacasable', qualifiers: {} }
      ])
      simplifyPropertyClaims(emptyValues.claims.P3984, { keepReferences: true }).should.deepEqual([
        { value: undefined, references: [] },
        { value: undefined, references: [] },
        { value: 'bacasable', references: [] }
      ])
      simplifyPropertyClaims(emptyValues.claims.P3984, { keepIds: true }).should.deepEqual([
        { value: undefined, id: 'Q4115189$c973aadc-48d3-5ac2-45fc-9f34a51ebdf6' },
        { value: undefined, id: 'Q4115189$db1940f1-41bd-ad24-8fbc-20bc6465a35f' },
        { value: 'bacasable', id: 'Q4115189$5c85ec5e-48f5-716d-8944-c4364693e406' }
      ])
      simplifyPropertyClaims(emptyValues.claims.P3984, { keepTypes: true }).should.deepEqual([
        { value: undefined, type: 'external-id' },
        { value: undefined, type: 'external-id' },
        { value: 'bacasable', type: 'external-id' }
      ])
    })
  })

  it('should use the placeholder value for empty values in object values', () => {
    simplifyPropertyClaims(emptyValues.claims.P3984, {
      keepQualifiers: true,
      novalueValue: '-',
      somevalueValue: '?'
    })
    .should.deepEqual([
      { value: '-', qualifiers: {} },
      { value: '?', qualifiers: {} },
      { value: 'bacasable', qualifiers: {} }
    ])
  })
})

describe('simplifyClaim', () => {
  describe('datatypes', () => {
    it('should return a url for datatype url', () => {
      const simplified = simplifyClaim(Q328212.claims.P856[0])
      simplified.should.equal('http://veronicarothbooks.blogspot.com')
    })

    it('should return simplified globecoordinate as a latLng array', () => {
      const simplified = simplifyClaim(Q2112.claims.P625[0])
      simplified.should.be.an.Array()
      simplified[0].should.equal(52.016666666667)
      simplified[1].should.equal(8.5166666666667)
    })

    it('should support geo-shape', () => {
      simplifyClaim(Q217447.claims.P3896[0]).should.equal('Data:Rky/1277_Verlan_teollisuusympäristö.map')
    })

    it('should support tabular-data', () => {
      simplifyClaim(Q271094.claims.P4179[0]).should.equal('Data:Taipei Neihu District Population.tab')
    })

    it('should support lexemes', () => {
      simplifyClaim(lexemeClaim).should.equal('L397')
    })

    it('should support musical-notation', () => {
      simplifyClaim(Q4115189.claims.P6604[0]).should.equal('\\relative { c d e f g e }')
    })

    it('should support wikibase-form', () => {
      simplifyClaim(Q275937.claims.P8017[0]).should.equal('L252247-F2')
    })

    it('should support wikibase-sense', () => {
      simplifyClaim(L525.claims.P5972[0]).should.equal('L512-S1')
    })
  })

  describe('prefixes', () => {
    it('should return prefixed entity ids if passed an entity prefix', () => {
      const claim = Q2112.claims.P190[0]
      simplifyClaim(claim).should.equal('Q207614')
      simplifyClaim(claim, { entityPrefix: 'wd' }).should.equal('wd:Q207614')
      simplifyClaim(claim, { entityPrefix: 'wd:' }).should.equal('wd::Q207614')
      simplifyClaim(claim, { entityPrefix: 'wdbla' }).should.equal('wdbla:Q207614')
    })

    it('should not apply property prefixes to property claim values', () => {
      const claim = Q2112.claims.P123456789[0]
      simplifyClaim(claim).should.equal('P207614')
      simplifyClaim(claim, { entityPrefix: null }).should.equal('P207614')
      simplifyClaim(claim, { propertyPrefix: 'wdt' }).should.equal('P207614')
      simplifyClaim(claim, { propertyPrefix: 'wdt:' }).should.equal('P207614')
      simplifyClaim(claim, { propertyPrefix: 'wdtbla' }).should.equal('P207614')
      simplifyClaim(claim, { entityPrefix: 'wd' }).should.equal('wd:P207614')
      simplifyClaim(claim, { entityPrefix: 'wd:' }).should.equal('wd::P207614')
      simplifyClaim(claim, { entityPrefix: 'wdbla' }).should.equal('wdbla:P207614')
    })
  })

  describe('keepTypes', () => {
    it('should return the correct value when called with keepQualifiers=true', () => {
      const simplified = simplifyClaim(Q2112.claims.P190[0], { keepTypes: true })
      simplified.should.deepEqual({ value: 'Q207614', type: 'wikibase-item' })
    })
  })

  describe('qualifiers', () => {
    it('should return the correct value when called with keepQualifiers=true', () => {
      const simplified = simplifyClaim(Q571.claims.P279[0])
      const simplifiedWithQualifiers = simplifyClaim(Q571.claims.P279[0], { keepQualifiers: true })
      simplifiedWithQualifiers.value.should.equal(simplified)
      simplifiedWithQualifiers.qualifiers.should.be.an.Object()
    })

    it('should include qualifiers when called with keepQualifiers=true', () => {
      const simplifiedWithQualifiers = simplifyClaim(Q571.claims.P1709[0], { keepQualifiers: true })
      simplifiedWithQualifiers.qualifiers.P973.should.be.an.Array()
      simplifiedWithQualifiers.qualifiers.P973[0].should.equal('http://mappings.dbpedia.org/index.php/OntologyClass:Book')
      simplifiedWithQualifiers.qualifiers.P813.should.be.an.Array()
      simplifiedWithQualifiers.qualifiers.P813[0].should.equal('2015-06-11T00:00:00.000Z')
    })

    it('should include prefixes in qualifiers claims', () => {
      const simplifiedWithQualifiers = simplifyClaim(Q646148.claims.P39[1], { entityPrefix: 'wd', propertyPrefix: 'wdt', keepQualifiers: true })
      simplifiedWithQualifiers.qualifiers['wdt:P1365'].should.be.an.Array()
      simplifiedWithQualifiers.qualifiers['wdt:P1365'][0].should.equal('wd:Q312881')
    })

    it('should include types in qualifiers claims', () => {
      const simplifiedWithQualifiers = simplifyClaim(Q646148.claims.P39[1], { keepTypes: true, keepQualifiers: true })
      simplifiedWithQualifiers.qualifiers.P1365.should.be.an.Array()
      simplifiedWithQualifiers.qualifiers.P1365[0].should.deepEqual({ value: 'Q312881', type: 'wikibase-item' })
    })

    it('should respect timeConverter for qualifiers claims', () => {
      let simplifiedWithQualifiers = simplifyClaim(Q571.claims.P1709[0], { keepQualifiers: true, timeConverter: 'iso' })
      simplifiedWithQualifiers.qualifiers.P813.should.be.an.Array()
      simplifiedWithQualifiers.qualifiers.P813[0].should.equal('2015-06-11T00:00:00.000Z')
      simplifiedWithQualifiers = simplifyClaim(Q571.claims.P1709[0], { keepQualifiers: true, timeConverter: 'epoch' })
      simplifiedWithQualifiers.qualifiers.P813.should.be.an.Array()
      simplifiedWithQualifiers.qualifiers.P813[0].should.equal(1433980800000)
      simplifiedWithQualifiers = simplifyClaim(Q571.claims.P1709[0], { keepQualifiers: true, timeConverter: 'simple-day' })
      simplifiedWithQualifiers.qualifiers.P813.should.be.an.Array()
      simplifiedWithQualifiers.qualifiers.P813[0].should.equal('2015-06-11')
      simplifiedWithQualifiers = simplifyClaim(Q571.claims.P1709[0], { keepQualifiers: true, timeConverter: 'none' })
      simplifiedWithQualifiers.qualifiers.P813.should.be.an.Array()
      simplifiedWithQualifiers.qualifiers.P813[0].should.equal('+2015-06-11T00:00:00Z')
      simplifiedWithQualifiers = simplifyClaim(Q571.claims.P1709[0], { keepQualifiers: true, timeConverter: v => `foo/${v.time}/${v.precision}/bar` })
      simplifiedWithQualifiers.qualifiers.P813.should.be.an.Array()
      simplifiedWithQualifiers.qualifiers.P813[0].should.equal('foo/+2015-06-11T00:00:00Z/11/bar')
    })
  })

  describe('references', () => {
    it('should return the correct value when called with keepReferences=true', () => {
      const simplified = simplifyClaim(Q2112.claims.P214[0])
      const simplifiedWithReferences = simplifyClaim(Q2112.claims.P214[0], { keepReferences: true })
      simplifiedWithReferences.value.should.equal(simplified)
      simplifiedWithReferences.references.should.be.an.Object()
    })

    it('should include references when called with keepReferences=true', () => {
      const simplifiedWithReferences = simplifyClaim(Q2112.claims.P214[0], { keepReferences: true })
      simplifiedWithReferences.references[0].P248.should.be.an.Array()
      simplifiedWithReferences.references[0].P248[0].should.equal('Q54919')
      simplifiedWithReferences.references[0].P813.should.be.an.Array()
      simplifiedWithReferences.references[0].P813[0].should.equal('2015-08-02T00:00:00.000Z')
    })

    it('should include prefixes in references claims', () => {
      const simplifiedWithReferences = simplifyClaim(Q2112.claims.P214[0], { entityPrefix: 'wd', propertyPrefix: 'wdt', keepReferences: true })
      simplifiedWithReferences.references[0]['wdt:P248'].should.be.an.Array()
      simplifiedWithReferences.references[0]['wdt:P248'][0].should.equal('wd:Q54919')
    })
  })

  describe('ids', () => {
    it('should return the correct value when called with keepIds=true', () => {
      const simplified = simplifyClaim(Q2112.claims.P214[0])
      const simplifiedWithIds = simplifyClaim(Q2112.claims.P214[0], { keepIds: true })
      simplifiedWithIds.value.should.equal(simplified)
      simplifiedWithIds.id.should.be.a.String()
    })

    it('should include ids when called with keepReferences=true', () => {
      const simplifiedWithIds = simplifyClaim(Q2112.claims.P214[0], { keepIds: true })
      simplifiedWithIds.id.should.equal('Q2112$ECB9E5BB-B2E1-4E77-8CEE-4E9F4938EB86')
    })
  })

  describe('hashes', () => {
    it('should return the correct value when called with keepHashes=true', () => {
      const simplified = simplifyClaim(Q2112.claims.P214[0])
      const simplifiedWithReferences = simplifyClaim(Q2112.claims.P214[0], { keepReferences: true, keepQualifiers: true, keepHashes: true })
      simplifiedWithReferences.value.should.equal(simplified)
    })

    it('should include references hashes when called with keepHashes=true', () => {
      const simplifiedWithReferences = simplifyClaim(Q2112.claims.P214[0], { keepReferences: true, keepHashes: true })
      simplifiedWithReferences.references[0].snaks.P248.should.be.an.Array()
      simplifiedWithReferences.references[0].hash.should.equal('d6b4bc80e47def2fab91836d81e1db62c640279c')
      simplifiedWithReferences.references[0].snaks.P248[0].should.equal('Q54919')
      simplifiedWithReferences.references[0].snaks.P813.should.be.an.Array()
      simplifiedWithReferences.references[0].snaks.P813[0].should.equal('2015-08-02T00:00:00.000Z')
    })

    it('should include qualifiers hashes when called with keepHashes=true', () => {
      const simplifiedWithQualifiers = simplifyPropertyClaims(Q2112.claims.P190, { keepQualifiers: true, keepHashes: true })
      simplifiedWithQualifiers[1].qualifiers.P580[0].value.should.equal('1953-01-01T00:00:00.000Z')
      simplifiedWithQualifiers[1].qualifiers.P580[0].hash.should.equal('3d22f4dffba1ac6f66f521ea6bea924e46df4129')
    })
  })

  describe('rich values', () => {
    it('should keep monolingual rich values', () => {
      const simplified = simplifyClaim(Q328212.claims.P1477[0], { keepRichValues: true })
      simplified.text.should.equal('Veronica Roth')
      simplified.language.should.equal('es')
    })

    it('should keep quantity rich values', () => {
      const simplified = simplifyClaim(Q2112.claims.P2044[0], { keepRichValues: true })
      simplified.amount.should.equal(118)
      simplified.unit.should.equal('Q11573')
      simplified.upperBound.should.equal(119)
      simplified.lowerBound.should.equal(117)
    })

    it('should keep globecoordinate rich values', () => {
      simplifyClaim(Q2112.claims.P625[0], { keepRichValues: true }).should.deepEqual({
        latitude: 52.016666666667,
        longitude: 8.5166666666667,
        altitude: null,
        precision: 0.016666666666667,
        globe: 'http://www.wikidata.org/entity/Q2'
      })
    })

    it('should keep time rich values', () => {
      simplifyClaim(Q646148.claims.P569[0], { keepRichValues: true }).should.deepEqual({
        time: '1939-11-08T00:00:00.000Z',
        timezone: 0,
        before: 0,
        after: 0,
        precision: 11,
        calendarmodel: 'http://www.wikidata.org/entity/Q1985727'
      })
    })
  })

  describe('time converter', () => {
    it('should use a custom time converter when one is set', () => {
      const claim = Q646148.claims.P569[0]
      const simplifyTimeClaim = timeConverter => simplifyClaim(claim, { timeConverter })
      simplifyTimeClaim().should.equal('1939-11-08T00:00:00.000Z')
      simplifyTimeClaim('iso').should.equal('1939-11-08T00:00:00.000Z')
      simplifyTimeClaim('epoch').should.equal(-951436800000)
      simplifyTimeClaim('simple-day').should.equal('1939-11-08')
      simplifyTimeClaim('none').should.equal('+1939-11-08T00:00:00Z')
      const timeConverterFn = ({ time, precision }) => `foo/${time}/${precision}/bar`
      simplifyTimeClaim(timeConverterFn).should.equal('foo/+1939-11-08T00:00:00Z/11/bar')
    })

    it('should be able to parse long dates', () => {
      const claim = Q1.claims.P580[0]
      const simplifyTimeClaim = timeConverter => simplifyClaim(claim, { timeConverter })
      simplifyTimeClaim().should.equal('-13798000000-01-01T00:00:00Z')
      simplifyTimeClaim('none').should.equal('-13798000000-00-00T00:00:00Z')
      simplifyTimeClaim('iso').should.equal('-13798000000-01-01T00:00:00Z')
      simplifyTimeClaim('simple-day').should.equal('-13798000000')
      const timeConverterFn = ({ time, precision }) => `foo/${time}/${precision}/bar`
      simplifyTimeClaim(timeConverterFn).should.equal('foo/-13798000000-00-00T00:00:00Z/3/bar')
      // Can't be supported due to JS large numbers limitations;
      // 13798000000*365.25*24*60*60*1000 is too big
      // timeClaim('epoch').should.equal('-13798000000-00-00T00:00:00Z')
    })
  })

  describe('empty values', () => {
    it('should return the desired novalueValue', () => {
      const noValueClaim = emptyValues.claims.P3984[0]
      should(simplifyClaim(noValueClaim)).not.be.ok()
      simplifyClaim(noValueClaim, { novalueValue: '-' }).should.equal('-')
      simplifyClaim(noValueClaim, { novalueValue: '' }).should.equal('')
    })

    it('should return the desired somevalueValue', () => {
      const someValueClaim = emptyValues.claims.P3984[1]
      should(simplifyClaim(someValueClaim)).not.be.ok()
      simplifyClaim(someValueClaim, { somevalueValue: '?' }).should.equal('?')
      simplifyClaim(someValueClaim, { somevalueValue: '' }).should.equal('')
    })

    it('should accept null as a possible value', () => {
      const noValueClaim = emptyValues.claims.P3984[0]
      should(simplifyClaim(noValueClaim, { novalueValue: null }) === null).be.true()
    })

    it('should return rich values for null values if requested', () => {
      simplifyClaim(emptyValues.claims.P3984[0], { keepQualifiers: true }).should.have.property('qualifiers')
      simplifyClaim(emptyValues.claims.P3984[0], { keepReferences: true }).should.have.property('references')
      simplifyClaim(emptyValues.claims.P3984[0], { keepIds: true }).should.have.property('id')
      simplifyClaim(emptyValues.claims.P3984[0], { keepTypes: true }).should.have.property('type')
    })
  })

  describe('keep all', () => {
    it('should activate all keep options', () => {
      const simplifiedP214 = simplifyClaim(Q2112.claims.P214[0], { keepAll: true })
      const simplifiedP625 = simplifyClaim(Q2112.claims.P625[0], { keepAll: true })
      simplifiedP214.value.should.be.a.String()
      simplifiedP214.id.should.be.a.String()
      simplifiedP214.type.should.be.a.String()
      simplifiedP214.rank.should.be.a.String()
      simplifiedP214.snaktype.should.be.a.String()
      simplifiedP214.qualifiers.should.be.an.Object()
      simplifiedP214.references.should.be.an.Array()
      simplifiedP214.references[0].snaks.P813[0].value.should.deepEqual({
        time: '2015-08-02T00:00:00.000Z',
        timezone: 0,
        before: 0,
        after: 0,
        precision: 11,
        calendarmodel: 'http://www.wikidata.org/entity/Q1985727'
      })
      simplifiedP214.references[0].hash.should.be.a.String()
      simplifiedP625.value.should.deepEqual({
        latitude: 52.016666666667,
        longitude: 8.5166666666667,
        altitude: null,
        precision: 0.016666666666667,
        globe: 'http://www.wikidata.org/entity/Q2'
      })
    })

    it('should be overriden by other flags', () => {
      const simplified = simplifyClaim(Q2112.claims.P214[0], { keepAll: true, keepTypes: false })
      simplified.value.should.be.a.String()
      simplified.id.should.be.a.String()
      should(simplified.type).not.be.ok()
      simplified.rank.should.be.a.String()
      simplified.snaktype.should.be.a.String()
      simplified.qualifiers.should.be.an.Object()
      simplified.references.should.be.an.Array()
      simplified.references[0].should.be.an.Object()
      simplified.references[0].hash.should.be.a.String()
    })
  })

  describe('lexemes', () => {
    it('should parse lexem claims', () => {
      simplifyClaims(L525.claims).should.deepEqual({
        P5185: [ 'Q1775415' ],
        P5972: [ 'L512-S1' ]
      })
    })
  })
})
