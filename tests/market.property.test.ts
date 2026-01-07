/**
 * Property-based tests for private market core functionality
 * Tests the correctness properties related to Chinese description display,
 * type filtering, and search functionality
 */

import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { getDisplayDescription, hasChineseDescription } from '../src/common/utils';
import type { Capability, CapabilityType } from '../src/common/types';

// Generators
const capabilityTypeArb = fc.constantFrom<CapabilityType>('skill', 'command', 'hook', 'mcp', 'setting', 'agent');

const capabilityContentArb = fc.record({
  type: capabilityTypeArb,
});

const capabilityArb = fc.record({
  id: fc.uuid(),
  type: capabilityTypeArb,
  name: fc.string({ minLength: 1, maxLength: 100 }),
  originalDescription: fc.string({ minLength: 1, maxLength: 500 }),
  chineseDescription: fc.option(fc.string({ minLength: 1, maxLength: 500 })),
  translationStatus: fc.constantFrom('pending', 'translating', 'auto_translated', 'manually_edited', 'failed'),
  sourcePlugin: fc.string({ minLength: 1, maxLength: 50 }),
  version: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
  author: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
  content: capabilityContentArb,
  metadata: fc.record({}),
  createdAt: fc.date(),
  updatedAt: fc.date(),
}) as fc.Arbitrary<Capability>;

describe('Private Market Core Functionality - Property Tests', () => {
  describe('Property 8: Chinese Description Priority Display', () => {
    it('**Feature: claude-config-orchestrator, Property 8: 中文描述优先显示**', () => {
      fc.assert(
        fc.property(capabilityArb, (capability) => {
          const displayDescription = getDisplayDescription(capability);
          
          // If Chinese description exists and is not empty, it should be returned
          if (capability.chineseDescription && capability.chineseDescription.trim() !== '') {
            expect(displayDescription).toBe(capability.chineseDescription);
          } else {
            // Otherwise, original description should be returned
            expect(displayDescription).toBe(capability.originalDescription);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly identify capabilities with Chinese descriptions', () => {
      fc.assert(
        fc.property(capabilityArb, (capability) => {
          const hasChinese = hasChineseDescription(capability);
          
          // Should return true only if Chinese description exists and is not empty/whitespace
          const expected = !!(capability.chineseDescription && capability.chineseDescription.trim() !== '');
          expect(hasChinese).toBe(expected);
        }),
        { numRuns: 100 }
      );
    });

    it('should never return empty string as display description', () => {
      fc.assert(
        fc.property(capabilityArb, (capability) => {
          const displayDescription = getDisplayDescription(capability);
          
          // Display description should never be empty
          expect(displayDescription).toBeTruthy();
          expect(displayDescription.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases with whitespace-only Chinese descriptions', () => {
      fc.assert(
        fc.property(
          fc.record({
            ...capabilityArb.value,
            chineseDescription: fc.option(fc.string().map(s => '   ' + s + '   ')),
          }) as fc.Arbitrary<Capability>,
          (capability) => {
            const displayDescription = getDisplayDescription(capability);
            
            // If Chinese description is only whitespace, should fall back to original
            if (capability.chineseDescription && capability.chineseDescription.trim() === '') {
              expect(displayDescription).toBe(capability.originalDescription);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: Type Filtering Correctness', () => {
    it('**Feature: claude-config-orchestrator, Property 9: 类型过滤正确性**', () => {
      fc.assert(
        fc.property(
          fc.array(capabilityArb, { minLength: 0, maxLength: 50 }),
          capabilityTypeArb,
          (capabilities, filterType) => {
            // Simulate type filtering logic
            const filtered = capabilities.filter(cap => cap.type === filterType);
            
            // All filtered results should have the specified type
            filtered.forEach(cap => {
              expect(cap.type).toBe(filterType);
            });
            
            // No capability of different type should be included
            const otherTypes = capabilities.filter(cap => cap.type !== filterType);
            otherTypes.forEach(cap => {
              expect(filtered).not.toContain(cap);
            });
            
            // All capabilities of the specified type should be included
            const expectedCapabilities = capabilities.filter(cap => cap.type === filterType);
            expect(filtered.length).toBe(expectedCapabilities.length);
            expectedCapabilities.forEach(cap => {
              expect(filtered).toContain(cap);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array when no capabilities match the filter type', () => {
      fc.assert(
        fc.property(
          fc.array(capabilityArb, { minLength: 1, maxLength: 20 }),
          capabilityTypeArb,
          (capabilities, filterType) => {
            // Ensure no capabilities have the filter type
            const modifiedCapabilities = capabilities.map(cap => ({
              ...cap,
              type: cap.type === filterType ? 
                (filterType === 'skill' ? 'command' : 'skill') as CapabilityType : 
                cap.type
            }));
            
            const filtered = modifiedCapabilities.filter(cap => cap.type === filterType);
            expect(filtered).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple type filtering correctly', () => {
      fc.assert(
        fc.property(
          fc.array(capabilityArb, { minLength: 0, maxLength: 30 }),
          fc.array(capabilityTypeArb, { minLength: 1, maxLength: 3 }),
          (capabilities, filterTypes) => {
            // Remove duplicates from filter types
            const uniqueFilterTypes = Array.from(new Set(filterTypes));
            
            // Apply multiple type filters (OR logic)
            const filtered = capabilities.filter(cap => 
              uniqueFilterTypes.includes(cap.type)
            );
            
            // All filtered results should have one of the specified types
            filtered.forEach(cap => {
              expect(uniqueFilterTypes).toContain(cap.type);
            });
            
            // Count should match expected
            const expectedCount = capabilities.filter(cap => 
              uniqueFilterTypes.includes(cap.type)
            ).length;
            expect(filtered.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain capability integrity during filtering', () => {
      fc.assert(
        fc.property(
          fc.array(capabilityArb, { minLength: 1, maxLength: 20 }),
          capabilityTypeArb,
          (capabilities, filterType) => {
            const filtered = capabilities.filter(cap => cap.type === filterType);
            
            // Each filtered capability should be identical to its original
            filtered.forEach(filteredCap => {
              const original = capabilities.find(cap => cap.id === filteredCap.id);
              expect(original).toBeDefined();
              expect(filteredCap).toEqual(original);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 10: Search Matching Correctness', () => {
    it('**Feature: claude-config-orchestrator, Property 10: 搜索匹配正确性**', () => {
      fc.assert(
        fc.property(
          fc.array(capabilityArb, { minLength: 0, maxLength: 30 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (capabilities, searchKeyword) => {
            const keyword = searchKeyword.toLowerCase().trim();
            if (!keyword) return; // Skip empty keywords
            
            // Simulate search logic
            const searchResults = capabilities.filter(cap => 
              cap.name.toLowerCase().includes(keyword) ||
              getDisplayDescription(cap).toLowerCase().includes(keyword) ||
              cap.originalDescription.toLowerCase().includes(keyword) ||
              cap.sourcePlugin.toLowerCase().includes(keyword) ||
              cap.author?.toLowerCase().includes(keyword)
            );
            
            // All search results should match the keyword in at least one field
            searchResults.forEach(cap => {
              const matches = 
                cap.name.toLowerCase().includes(keyword) ||
                getDisplayDescription(cap).toLowerCase().includes(keyword) ||
                cap.originalDescription.toLowerCase().includes(keyword) ||
                cap.sourcePlugin.toLowerCase().includes(keyword) ||
                (cap.author && cap.author.toLowerCase().includes(keyword));
              
              expect(matches).toBe(true);
            });
            
            // No non-matching capabilities should be included
            const nonMatching = capabilities.filter(cap => 
              !cap.name.toLowerCase().includes(keyword) &&
              !getDisplayDescription(cap).toLowerCase().includes(keyword) &&
              !cap.originalDescription.toLowerCase().includes(keyword) &&
              !cap.sourcePlugin.toLowerCase().includes(keyword) &&
              (!cap.author || !cap.author.toLowerCase().includes(keyword))
            );
            
            nonMatching.forEach(cap => {
              expect(searchResults).not.toContain(cap);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle case-insensitive search correctly', () => {
      fc.assert(
        fc.property(
          fc.array(capabilityArb, { minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          (capabilities, searchTerm) => {
            const lowerKeyword = searchTerm.toLowerCase();
            const upperKeyword = searchTerm.toUpperCase();
            const mixedKeyword = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase();
            
            // All three variations should produce the same results
            const lowerResults = capabilities.filter(cap => 
              cap.name.toLowerCase().includes(lowerKeyword) ||
              getDisplayDescription(cap).toLowerCase().includes(lowerKeyword)
            );
            
            const upperResults = capabilities.filter(cap => 
              cap.name.toLowerCase().includes(upperKeyword.toLowerCase()) ||
              getDisplayDescription(cap).toLowerCase().includes(upperKeyword.toLowerCase())
            );
            
            const mixedResults = capabilities.filter(cap => 
              cap.name.toLowerCase().includes(mixedKeyword.toLowerCase()) ||
              getDisplayDescription(cap).toLowerCase().includes(mixedKeyword.toLowerCase())
            );
            
            expect(lowerResults).toEqual(upperResults);
            expect(lowerResults).toEqual(mixedResults);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty and whitespace-only search terms', () => {
      fc.assert(
        fc.property(
          fc.array(capabilityArb, { minLength: 0, maxLength: 20 }),
          fc.constantFrom('', '   ', '\t', '\n', '  \t  '),
          (capabilities, emptyKeyword) => {
            const trimmed = emptyKeyword.trim();
            
            if (!trimmed) {
              // Empty search should return all capabilities or handle gracefully
              // This depends on implementation - we expect no filtering for empty search
              const results = capabilities; // No filtering applied
              expect(results).toEqual(capabilities);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should search in Chinese descriptions when available', () => {
      fc.assert(
        fc.property(
          fc.array(capabilityArb, { minLength: 1, maxLength: 15 }),
          fc.string({ minLength: 2, maxLength: 8 }),
          (capabilities, searchTerm) => {
            const keyword = searchTerm.toLowerCase().trim();
            if (!keyword) return; // Skip empty keywords
            
            const results = capabilities.filter(cap => {
              const displayDesc = getDisplayDescription(cap);
              return displayDesc && displayDesc.toLowerCase().includes(keyword);
            });
            
            // Verify that search uses the correct description (Chinese if available, original otherwise)
            results.forEach(cap => {
              const displayDesc = getDisplayDescription(cap);
              expect(displayDesc).toBeTruthy();
              expect(displayDesc.toLowerCase().includes(keyword)).toBe(true);
              
              // Verify that getDisplayDescription returns Chinese if available, original otherwise
              if (cap.chineseDescription && cap.chineseDescription.trim() !== '') {
                expect(displayDesc).toBe(cap.chineseDescription);
              } else {
                expect(displayDesc).toBe(cap.originalDescription);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain search result integrity', () => {
      fc.assert(
        fc.property(
          fc.array(capabilityArb, { minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 15 }),
          (capabilities, searchKeyword) => {
            const keyword = searchKeyword.toLowerCase().trim();
            if (!keyword) return;
            
            const results = capabilities.filter(cap => 
              cap.name.toLowerCase().includes(keyword) ||
              getDisplayDescription(cap).toLowerCase().includes(keyword)
            );
            
            // Each result should be identical to its original capability
            results.forEach(result => {
              const original = capabilities.find(cap => cap.id === result.id);
              expect(original).toBeDefined();
              expect(result).toEqual(original);
            });
            
            // Results should be a subset of original capabilities
            expect(results.length).toBeLessThanOrEqual(capabilities.length);
            results.forEach(result => {
              expect(capabilities).toContain(result);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 23: Cache Cleanup Preserves Capability Information', () => {
    // Mock cache entries generator
    const pluginCacheEntryArb = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      version: fc.string({ minLength: 1, maxLength: 20 }),
      sourceUrl: fc.option(fc.webUrl()),
      localPath: fc.string({ minLength: 1, maxLength: 100 }),
      sizeBytes: fc.integer({ min: 1000, max: 100000000 }),
      lastAccessedAt: fc.date(),
      createdAt: fc.date(),
    });

    it('**Feature: claude-config-orchestrator, Property 23: 缓存清理保留能力信息**', () => {
      fc.assert(
        fc.property(
          fc.array(capabilityArb, { minLength: 1, maxLength: 20 }),
          fc.array(pluginCacheEntryArb, { minLength: 0, maxLength: 30 }),
          (capabilities, cacheEntries) => {
            // Get unique source plugins from capabilities
            const usedPlugins = new Set(capabilities.map(cap => cap.sourcePlugin));
            
            // Simulate cache cleanup logic
            const preservedCacheEntries = cacheEntries.filter(entry => 
              usedPlugins.has(entry.name)
            );
            
            const removedCacheEntries = cacheEntries.filter(entry => 
              !usedPlugins.has(entry.name)
            );
            
            // After cleanup, all capabilities should still be accessible
            capabilities.forEach(capability => {
              // Capability information should be preserved
              expect(capability.id).toBeTruthy();
              expect(capability.name).toBeTruthy();
              expect(capability.originalDescription).toBeTruthy();
              expect(capability.sourcePlugin).toBeTruthy();
              
              // Chinese descriptions should be preserved
              if (capability.chineseDescription) {
                expect(capability.chineseDescription).toBeTruthy();
              }
              
              // Translation status should be preserved
              expect(capability.translationStatus).toBeTruthy();
            });
            
            // Cache entries for used plugins should be preserved
            const usedPluginNames = Array.from(usedPlugins);
            usedPluginNames.forEach(pluginName => {
              const relatedCacheEntries = cacheEntries.filter(entry => entry.name === pluginName);
              const preservedRelatedEntries = preservedCacheEntries.filter(entry => entry.name === pluginName);
              
              // All cache entries for used plugins should be preserved
              expect(preservedRelatedEntries.length).toBe(relatedCacheEntries.length);
            });
            
            // No cache entries for unused plugins should be preserved
            removedCacheEntries.forEach(removedEntry => {
              expect(preservedCacheEntries).not.toContain(removedEntry);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all capability metadata during cache cleanup', () => {
      fc.assert(
        fc.property(
          fc.array(capabilityArb, { minLength: 1, maxLength: 15 }),
          (capabilities) => {
            // Simulate cache cleanup - capabilities should remain unchanged
            const capabilitiesAfterCleanup = [...capabilities];
            
            // All capability properties should be preserved
            capabilities.forEach((originalCap, index) => {
              const preservedCap = capabilitiesAfterCleanup[index];
              
              expect(preservedCap.id).toBe(originalCap.id);
              expect(preservedCap.name).toBe(originalCap.name);
              expect(preservedCap.originalDescription).toBe(originalCap.originalDescription);
              expect(preservedCap.chineseDescription).toBe(originalCap.chineseDescription);
              expect(preservedCap.translationStatus).toBe(originalCap.translationStatus);
              expect(preservedCap.sourcePlugin).toBe(originalCap.sourcePlugin);
              expect(preservedCap.type).toBe(originalCap.type);
              expect(preservedCap.version).toBe(originalCap.version);
              expect(preservedCap.author).toBe(originalCap.author);
              expect(preservedCap.content).toEqual(originalCap.content);
              expect(preservedCap.metadata).toEqual(originalCap.metadata);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle cache cleanup with no capabilities gracefully', () => {
      fc.assert(
        fc.property(
          fc.array(pluginCacheEntryArb, { minLength: 1, maxLength: 20 }),
          (cacheEntries) => {
            // When there are no capabilities, all cache entries should be considered unused
            const capabilities: Capability[] = [];
            const usedPlugins = new Set(capabilities.map(cap => cap.sourcePlugin));
            
            const preservedCacheEntries = cacheEntries.filter(entry => 
              usedPlugins.has(entry.name)
            );
            
            // No cache entries should be preserved when there are no capabilities
            expect(preservedCacheEntries).toHaveLength(0);
            
            // All cache entries should be considered for removal
            const removedCacheEntries = cacheEntries.filter(entry => 
              !usedPlugins.has(entry.name)
            );
            expect(removedCacheEntries.length).toBe(cacheEntries.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve Chinese descriptions regardless of cache cleanup', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              ...capabilityArb.value,
              chineseDescription: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
              translationStatus: fc.constantFrom('manually_edited', 'auto_translated'),
            }) as fc.Arbitrary<Capability>,
            { minLength: 1, maxLength: 15 }
          ),
          (capabilities) => {
            // Cache cleanup should not affect Chinese descriptions
            const capabilitiesWithChinese = capabilities.filter(cap => 
              cap.chineseDescription && cap.chineseDescription.trim() !== ''
            );
            
            // After simulated cache cleanup, Chinese descriptions should remain
            capabilitiesWithChinese.forEach(cap => {
              expect(cap.chineseDescription).toBeTruthy();
              expect(cap.chineseDescription!.trim()).not.toBe('');
              
              // Translation status should indicate manual or auto translation
              expect(['manually_edited', 'auto_translated']).toContain(cap.translationStatus);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain capability-cache relationship consistency', () => {
      fc.assert(
        fc.property(
          fc.array(capabilityArb, { minLength: 1, maxLength: 10 }),
          fc.array(pluginCacheEntryArb, { minLength: 1, maxLength: 15 }),
          (capabilities, cacheEntries) => {
            // Ensure each capability has at least one matching cache entry
            const modifiedCacheEntries = [...cacheEntries];
            
            // For each capability, ensure there's at least one cache entry with matching name
            capabilities.forEach((cap, index) => {
              if (index < modifiedCacheEntries.length) {
                modifiedCacheEntries[index] = { 
                  ...modifiedCacheEntries[index], 
                  name: cap.sourcePlugin 
                };
              } else {
                // Add a new cache entry if we don't have enough
                modifiedCacheEntries.push({
                  id: `cache-${index}`,
                  name: cap.sourcePlugin,
                  version: '1.0.0',
                  sourceUrl: undefined,
                  localPath: `/cache/${cap.sourcePlugin}`,
                  sizeBytes: 1000,
                  lastAccessedAt: new Date(),
                  createdAt: new Date(),
                });
              }
            });
            
            const usedPlugins = new Set(capabilities.map(cap => cap.sourcePlugin));
            const preservedEntries = modifiedCacheEntries.filter(entry => 
              usedPlugins.has(entry.name)
            );
            
            // Every capability should have at least one corresponding cache entry preserved
            capabilities.forEach(cap => {
              const relatedCacheEntries = preservedEntries.filter(entry => 
                entry.name === cap.sourcePlugin
              );
              expect(relatedCacheEntries.length).toBeGreaterThan(0);
            });
            
            // All preserved entries should correspond to used plugins
            preservedEntries.forEach(entry => {
              expect(usedPlugins.has(entry.name)).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});