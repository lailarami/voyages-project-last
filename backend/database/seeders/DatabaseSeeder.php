<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\{User, Fournisseur, Voyage, Reservation, Paiement, Avis, TicketSupport};

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        
        $admin = User::create([
            'nom'      => 'Administrateur',
            'prenom'   => 'Super',
            'email'    => 'admin@voyages.ma',
            'password' => Hash::make('password'),
            'role'     => 'admin',
            'status'   => 'actif',
            'telephone' => '+212600000001',
        ]);

        
        $support = User::create([
            'nom'      => 'Support',
            'prenom'   => 'Agent',
            'email'    => 'support@voyages.ma',
            'password' => Hash::make('password'),
            'role'     => 'support',
            'status'   => 'actif',
            'telephone' => '+212600000002',
        ]);

        
        $fournisseurUser = User::create([
            'nom'      => 'Voyages',
            'prenom'   => 'Atlas',
            'email'    => 'fournisseur@voyages.ma',
            'password' => Hash::make('password'),
            'role'     => 'fournisseur',
            'status'   => 'actif',
            'telephone' => '+212600000003',
        ]);

        $fournisseur = Fournisseur::create([
            'user_id'    => $fournisseurUser->id,
            'nom'        => 'Atlas Voyages Maroc',
            'email'      => 'contact@atlasvoyages.ma',
            'telephone'  => '+212522000001',
            'service'    => 'Tours & Excursions',
            'description' => 'Agence de voyages premium au Maroc spécialisée dans les circuits organisés.',
            'statut'     => 'actif',
            'commission' => 10.00,
        ]);

        
        $client = User::create([
            'nom'       => 'El Amrani',
            'prenom'    => 'Youssef',
            'email'     => 'client@voyages.ma',
            'password'  => Hash::make('password'),
            'role'      => 'client',
            'status'    => 'actif',
            'telephone' => '+212661234567',
            'adresse'   => 'Casablanca, Maroc',
        ]);

        // ===========================
        // VOYAGES
        // ===========================
        $voyagesData = [
            [
                'titre' => 'Circuit Désert du Sahara - Merzouga',
                'destination' => 'Merzouga',
                'pays' => 'Maroc',
                'description' => 'Vivez une expérience inoubliable dans les dunes dorées du Sahara marocain.',
                'description_longue' => 'Partez à la découverte du désert de Merzouga, avec ses immenses dunes de sable, ses nuits étoilées et sa culture berbère authentique. Un voyage hors du temps qui vous marquera à jamais.',
                'prix' => 2500.00,
                'prix_ancien' => 3000.00,
                'date_depart' => '2025-03-15',
                'date_retour' => '2025-03-22',
                'places_disponibles' => 20,
                'places_totales' => 20,
                'categorie' => 'desert',
                'image' => 'voyages/sahara.jpg',
                'fournisseur_id' => $fournisseur->id,
                'inclus' => ['Hébergement', 'Petit-déjeuner', 'Balade dromadaire', 'Guide'],
                'non_inclus' => ['Vols', 'Déjeuners', 'Dépenses personnelles'],
                'niveau_difficulte' => 'moyen',
                'featured' => true,
                'devise' => 'MAD',
                'reduction' => 15,
            ],
            [
                'titre' => 'Escapade à Chefchaouen - La Ville Bleue',
                'destination' => 'Chefchaouen',
                'pays' => 'Maroc',
                'description' => 'Perdez-vous dans les ruelles bleues de la perle du Rif.',
                'description_longue' => 'Chefchaouen, la magnifique ville bleue nichée dans les montagnes du Rif. Ses ruelles azurées, ses marchés animés et sa cuisine délicieuse font de cette ville une destination unique.',
                'prix' => 1800.00,
                'date_depart' => '2025-04-10',
                'date_retour' => '2025-04-14',
                'places_disponibles' => 15,
                'places_totales' => 15,
                'categorie' => 'culture',
                'image' => 'voyages/chefchaouen.jpg',
                'fournisseur_id' => $fournisseur->id,
                'inclus' => ['Hébergement Riad', 'Petit-déjeuner', 'Guide local', 'Transport'],
                'non_inclus' => ['Repas', 'Activités optionnelles'],
                'niveau_difficulte' => 'facile',
                'featured' => true,
                'devise' => 'MAD',
            ],
            [
                'titre' => 'Marrakech Authentique - Circuit Complet',
                'destination' => 'Marrakech',
                'pays' => 'Maroc',
                'description' => 'Plongez au cœur de la ville ocre, entre palais, souks et jardins luxuriants.',
                'description_longue' => 'Découvrez Marrakech, la ville rouge : Jemaa el-Fna, les souks millénaires, les palais somptueux et les jardins de la Ménara. Un mélange enivrant de traditions et de modernité.',
                'prix' => 3200.00,
                'prix_ancien' => 3800.00,
                'date_depart' => '2025-05-01',
                'date_retour' => '2025-05-07',
                'places_disponibles' => 25,
                'places_totales' => 25,
                'categorie' => 'culture',
                'image' => 'voyages/marrakech.jpg',
                'fournisseur_id' => $fournisseur->id,
                'inclus' => ['Riad 5 étoiles', 'Pension complète', 'Hammam', 'Guide', 'Excursions'],
                'non_inclus' => ['Vols', 'Dépenses personnelles'],
                'niveau_difficulte' => 'facile',
                'featured' => true,
                'devise' => 'MAD',
                'reduction' => 10,
            ],
            [
                'titre' => 'Vallée du Dadès - Canyon Rose',
                'destination' => 'Dadès',
                'pays' => 'Maroc',
                'description' => 'Explorez les gorges majestueuses du Dadès et la vallée des roses.',
                'prix' => 2200.00,
                'date_depart' => '2025-04-20',
                'date_retour' => '2025-04-25',
                'places_disponibles' => 12,
                'places_totales' => 12,
                'categorie' => 'aventure',
                'image' => 'voyages/dades.jpg',
                'fournisseur_id' => $fournisseur->id,
                'inclus' => ['Hébergement', 'Demi-pension', 'Randonnée guidée', 'Transport 4x4'],
                'non_inclus' => ['Vols', 'Équipement de randonnée'],
                'niveau_difficulte' => 'difficile',
                'featured' => false,
                'devise' => 'MAD',
            ],
            [
                'titre' => 'Essaouira - Cité des Alizés',
                'destination' => 'Essaouira',
                'pays' => 'Maroc',
                'description' => 'Découvrez la cité des vents, ses remparts et sa plage sauvage.',
                'prix' => 1500.00,
                'date_depart' => '2025-06-15',
                'date_retour' => '2025-06-18',
                'places_disponibles' => 18,
                'places_totales' => 18,
                'categorie' => 'plage',
                'image' => 'voyages/essaouira.jpg',
                'fournisseur_id' => $fournisseur->id,
                'inclus' => ['Riad', 'Petit-déjeuner', 'Activités Surf', 'Guide'],
                'non_inclus' => ['Transport', 'Repas'],
                'niveau_difficulte' => 'facile',
                'featured' => true,
                'devise' => 'MAD',
            ],
            [
                'titre' => 'Circuit Côte Atlantique - Agadir & Souss',
                'destination' => 'Agadir',
                'pays' => 'Maroc',
                'description' => 'Profitez du soleil et des plages d\'Agadir avec une découverte de la région du Souss.',
                'prix' => 2800.00,
                'prix_ancien' => 3200.00,
                'date_depart' => '2025-07-10',
                'date_retour' => '2025-07-17',
                'places_disponibles' => 30,
                'places_totales' => 30,
                'categorie' => 'plage',
                'image' => 'voyages/agadir.jpg',
                'fournisseur_id' => $fournisseur->id,
                'inclus' => ['Hôtel 4 étoiles bord de mer', 'All inclusive', 'Excursions', 'Animateur'],
                'non_inclus' => ['Vols', 'Spa', 'Activités premium'],
                'niveau_difficulte' => 'facile',
                'featured' => false,
                'devise' => 'MAD',
                'reduction' => 12.5,
            ],
        ];

        foreach ($voyagesData as $voyageData) {
            Voyage::create($voyageData);
        }

        // ===========================
        // SAMPLE RESERVATION
        // ===========================
        $voyage = Voyage::first();
        $reservation = Reservation::create([
            'user_id'       => $client->id,
            'voyage_id'     => $voyage->id,
            'nombre_places' => 2,
            'statut'        => 'confirmee',
            'montant_total' => $voyage->prix * 2,
            'montant_paye'  => $voyage->prix * 2,
            'date_confirmation' => now(),
        ]);

        Paiement::create([
            'reservation_id' => $reservation->id,
            'montant'        => $reservation->montant_total,
            'methode'        => 'stripe',
            'transaction_id' => 'pi_test_' . uniqid(),
            'statut'         => 'reussi',
            'date_paiement'  => now(),
        ]);

        // ===========================
        // SAMPLE AVIS
        // ===========================
        Avis::create([
            'user_id'    => $client->id,
            'voyage_id'  => $voyage->id,
            'note'       => 5,
            'titre'      => 'Voyage absolument magique !',
            'commentaire' => 'Une expérience inoubliable dans le Sahara. L\'organisation était parfaite, le guide très compétent. Je recommande vivement !',
            'approuve'   => true,
        ]);

        // ===========================
        // SAMPLE TICKET
        // ===========================
        TicketSupport::create([
            'user_id'        => $client->id,
            'sujet'          => 'Question sur ma réservation',
            'message'        => 'Bonjour, je souhaite modifier le nombre de places pour ma réservation. Est-ce possible ?',
            'statut'         => 'ouvert',
            'priorite'       => 'normale',
            'categorie'      => 'reservation',
            'reservation_id' => $reservation->id,
        ]);

        $this->command->info('✅ Base de données initialisée avec succès !');
        $this->command->info('📧 Admin: admin@voyages.ma / password');
        $this->command->info('📧 Client: client@voyages.ma / password');
        $this->command->info('📧 Support: support@voyages.ma / password');
        $this->command->info('📧 Fournisseur: fournisseur@voyages.ma / password');
    }
}
