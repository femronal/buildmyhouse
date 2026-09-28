import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, VendorListingStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { categoryMatchSlugs } from './vendor-catalog';
import { PrismaService } from '../prisma/prisma.service';

export type VendorCategoryNode = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  vendorCount: number;
  children: VendorCategoryNode[];
};

@Injectable()
export class VendorCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async tree(includeHidden = true): Promise<VendorCategoryNode[]> {
    const rows = await this.prisma.vendorCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { links: true } } },
    });
    const nodes = new Map<string, VendorCategoryNode>();
    for (const row of rows) {
      if (!includeHidden && !row.isActive) continue;
      nodes.set(row.id, {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        parentId: row.parentId,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
        vendorCount: row._count.links,
        children: [],
      });
    }
    const roots: VendorCategoryNode[] = [];
    for (const node of nodes.values()) {
      if (node.parentId && nodes.has(node.parentId)) nodes.get(node.parentId)!.children.push(node);
      else roots.push(node);
    }
    return roots;
  }

  /** Active categories that have at least one listed vendor, for public filters. */
  async publicFilters(includeEmpty = false) {
    const rows = await this.prisma.vendorCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        parent: { select: { id: true, name: true, slug: true, isActive: true } },
        _count: {
          select: {
            links: { where: { vendorProfile: { listingStatus: VendorListingStatus.listed, deletedAt: null } } },
          },
        },
      },
    });
    const parentIds = new Set(rows.map((row) => row.parentId).filter((id): id is string => !!id));
    return rows
      .filter((row) => !parentIds.has(row.id))
      .filter((row) => (includeEmpty || row._count.links > 0) && (!row.parentId || row.parent?.isActive !== false))
      .map((row) => ({
        slug: row.slug,
        label: row.name,
        group: row.parent?.name ?? null,
        groupSlug: row.parent?.slug ?? null,
        vendorCount: row._count.links,
      }));
  }

  async labelMap(): Promise<Record<string, string>> {
    const rows = await this.prisma.vendorCategory.findMany({ select: { slug: true, name: true } });
    return Object.fromEntries(rows.map((row) => [row.slug, row.name]));
  }

  async resolveFilter(slug: string): Promise<{ slugs: string[]; canonical: string; redirectedFrom: string | null }> {
    const redirect = await this.prisma.vendorCategoryRedirect.findUnique({
      where: { fromSlug: slug },
      include: { category: { select: { slug: true, id: true, parentId: true } } },
    });
    const canonical = redirect?.category.slug || slug;
    const row =
      redirect?.category ||
      (await this.prisma.vendorCategory.findUnique({
        where: { slug: canonical },
        select: { slug: true, id: true, parentId: true },
      }));
    const childSlugs = row && !row.parentId
      ? (await this.prisma.vendorCategory.findMany({ where: { parentId: row.id }, select: { slug: true } })).map((child) => child.slug)
      : [];
    const slugs = Array.from(new Set([...categoryMatchSlugs(slug), ...categoryMatchSlugs(canonical), canonical, slug, ...childSlugs]));
    return { slugs, canonical, redirectedFrom: redirect ? slug : null };
  }

  /** Labels used on public cards. A hidden category falls back to its parent, then Other. */
  async displayLabels(): Promise<Record<string, string>> {
    const rows = await this.prisma.vendorCategory.findMany({
      select: { slug: true, name: true, isActive: true, parent: { select: { name: true, isActive: true } } },
    });
    return Object.fromEntries(
      rows.map((row) => {
        if (row.isActive) return [row.slug, row.name];
        if (row.parent?.isActive) return [row.slug, row.parent.name];
        return [row.slug, 'Other'];
      }),
    );
  }

  async create(input: { name: string; slug?: string; description?: string; parentId?: string | null }, actorAdminId?: string) {
    const name = input.name.trim();
    if (!name) throw new BadRequestException('Category name is required');
    const slug = this.cleanSlug(input.slug || name);
    if (input.parentId) {
      const parent = await this.prisma.vendorCategory.findUnique({ where: { id: input.parentId } });
      if (!parent) throw new BadRequestException('Parent category was not found');
      if (parent.parentId) throw new BadRequestException('A sub-category cannot have its own sub-category');
    }
    const existing = await this.prisma.vendorCategory.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('That category slug is already in use');
    const siblings = await this.prisma.vendorCategory.count({ where: { parentId: input.parentId || null } });
    const row = await this.prisma.vendorCategory.create({
      data: {
        id: randomUUID(),
        name,
        slug,
        description: input.description?.trim() || null,
        parentId: input.parentId || null,
        sortOrder: siblings,
      },
    });
    await this.audit(actorAdminId, 'create', row.id, `Created category ${row.name}`, { slug: row.slug });
    return row;
  }

  async update(
    id: string,
    input: { name?: string; slug?: string; description?: string | null; isActive?: boolean },
    actorAdminId?: string,
  ) {
    const current = await this.mustFind(id);
    const data: Prisma.VendorCategoryUpdateInput = {};
    if (input.name != null) {
      const name = input.name.trim();
      if (!name) throw new BadRequestException('Category name is required');
      data.name = name;
    }
    if (input.description !== undefined) data.description = input.description?.trim() || null;
    if (input.isActive != null) data.isActive = input.isActive;
    let nextSlug = current.slug;
    if (input.slug && this.cleanSlug(input.slug) !== current.slug) {
      nextSlug = this.cleanSlug(input.slug);
      const taken = await this.prisma.vendorCategory.findUnique({ where: { slug: nextSlug } });
      if (taken && taken.id !== current.id) throw new ConflictException('That category slug is already in use');
      data.slug = nextSlug;
    }
    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.vendorCategory.update({ where: { id }, data });
      if (nextSlug !== current.slug) {
        await tx.vendorCategoryRedirect.upsert({
          where: { fromSlug: current.slug },
          create: { id: randomUUID(), fromSlug: current.slug, categoryId: current.id },
          update: { categoryId: current.id },
        });
        await this.rewriteVendorSlugs(tx, current.slug, nextSlug);
      }
      return updated;
    });
    await this.audit(actorAdminId, 'update', row.id, `Updated category ${row.name}`, {
      fromSlug: current.slug,
      slug: row.slug,
      isActive: row.isActive,
    });
    return row;
  }

  async reorder(items: Array<{ id: string; sortOrder: number }>, actorAdminId?: string) {
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.vendorCategory.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } }),
      ),
    );
    await this.audit(actorAdminId, 'reorder', null, 'Reordered vendor categories', { count: items.length });
    return this.tree();
  }

  async remove(id: string, actorAdminId?: string) {
    const current = await this.mustFind(id);
    const [links, children] = await Promise.all([
      this.prisma.vendorCategoryLink.count({ where: { categoryId: id } }),
      this.prisma.vendorCategory.count({ where: { parentId: id } }),
    ]);
    if (links > 0) {
      throw new ConflictException('This category is used by vendors. Merge it into another category, or hide it.');
    }
    if (children > 0) throw new ConflictException('Move or delete the sub-categories before deleting this category.');
    await this.prisma.vendorCategory.delete({ where: { id } });
    await this.audit(actorAdminId, 'delete', id, `Deleted unused category ${current.name}`, { slug: current.slug });
    return { deleted: true };
  }

  async merge(id: string, intoId: string, actorAdminId?: string) {
    if (id === intoId) throw new BadRequestException('Choose a different category to merge into');
    const from = await this.mustFind(id);
    const into = await this.mustFind(intoId);
    await this.prisma.$transaction(async (tx) => {
      const links = await tx.vendorCategoryLink.findMany({ where: { categoryId: from.id } });
      for (const link of links) {
        const already = await tx.vendorCategoryLink.findUnique({
          where: { vendorProfileId_categoryId: { vendorProfileId: link.vendorProfileId, categoryId: into.id } },
        });
        if (already) {
          if (link.isPrimary && !already.isPrimary) {
            await tx.vendorCategoryLink.update({ where: { id: already.id }, data: { isPrimary: true } });
          }
          await tx.vendorCategoryLink.delete({ where: { id: link.id } });
        } else {
          await tx.vendorCategoryLink.update({ where: { id: link.id }, data: { categoryId: into.id } });
        }
      }
      await this.rewriteVendorSlugs(tx, from.slug, into.slug);
      await tx.vendorCategoryRedirect.upsert({
        where: { fromSlug: from.slug },
        create: { id: randomUUID(), fromSlug: from.slug, categoryId: into.id },
        update: { categoryId: into.id },
      });
      await tx.vendorCategory.update({ where: { id: from.id }, data: { isActive: false } });
    });
    await this.audit(actorAdminId, 'merge', from.id, `Merged ${from.name} into ${into.name}`, {
      fromSlug: from.slug,
      intoSlug: into.slug,
    });
    return { merged: true, intoSlug: into.slug };
  }

  async syncVendor(vendorProfileId: string, primarySlug: string | null, extraSlugs: string[]) {
    const slugs = Array.from(new Set([primarySlug, ...extraSlugs].filter((slug): slug is string => Boolean(slug))));
    const rows = slugs.length
      ? await this.prisma.vendorCategory.findMany({ where: { slug: { in: slugs } } })
      : [];
    const bySlug = new Map(rows.map((row) => [row.slug, row]));
    await this.prisma.$transaction(async (tx) => {
      await tx.vendorCategoryLink.deleteMany({ where: { vendorProfileId } });
      if (!slugs.length) return;
      await tx.vendorCategoryLink.createMany({
        data: slugs
          .filter((slug) => bySlug.has(slug))
          .map((slug) => ({
            id: randomUUID(),
            vendorProfileId,
            categoryId: bySlug.get(slug)!.id,
            isPrimary: slug === primarySlug,
          })),
      });
    });
  }

  private async rewriteVendorSlugs(tx: Prisma.TransactionClient, fromSlug: string, toSlug: string) {
    await tx.vendorProfile.updateMany({ where: { primaryFamilyKey: fromSlug }, data: { primaryFamilyKey: toSlug } });
    await tx.vendorOffering.updateMany({ where: { familyKey: fromSlug }, data: { familyKey: toSlug } });
    const secondary = await tx.vendorProfile.findMany({
      where: { secondaryFamilyKeys: { has: fromSlug } },
      select: { id: true, secondaryFamilyKeys: true },
    });
    for (const row of secondary) {
      const next = Array.from(new Set(row.secondaryFamilyKeys.map((slug) => (slug === fromSlug ? toSlug : slug))));
      await tx.vendorProfile.update({ where: { id: row.id }, data: { secondaryFamilyKeys: next } });
    }
  }

  private async mustFind(id: string) {
    const row = await this.prisma.vendorCategory.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Category not found');
    return row;
  }

  private cleanSlug(value: string) {
    const slug = value
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
    if (!slug) throw new BadRequestException('Category slug is required');
    return slug;
  }

  private audit(actorAdminId: string | undefined, action: string, categoryId: string | null, summary: string, metadata?: Prisma.InputJsonValue) {
    return this.prisma.vendorCategoryAudit.create({
      data: { id: randomUUID(), actorAdminId: actorAdminId || null, action, categoryId, summary, metadata },
    });
  }
}
